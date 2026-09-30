package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"mime"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/edvance/video-engine/internal/config"
	"github.com/edvance/video-engine/internal/storage"
)

const defaultPort = "8080"

const (
	jobStatusQueued     = "queued"
	jobStatusProcessing = "processing"
	jobStatusCompleted  = "completed"
	jobStatusFailed     = "failed"
)

var defaultJobStore = newJobStore()
var appStorage storage.Storage

// transcodeRequest models a CRUD-like submission for a video workflow.
type transcodeRequest struct {
	Input       string   `json:"input"`
	Output      string   `json:"output,omitempty"`
	Preset      string   `json:"preset,omitempty"`
	Presets     []string `json:"presets,omitempty"`
	Title       string   `json:"title,omitempty"`
	Description string   `json:"description,omitempty"`
}

type transcodeJob struct {
	ID           string     `json:"jobId"`
	Title        string     `json:"title,omitempty"`
	Input        string     `json:"input"`
	Output       string     `json:"output,omitempty"`
	Status       string     `json:"status"`
	Presets      []string   `json:"presets"`
	ManifestURL  string     `json:"manifestUrl,omitempty"`
	ThumbnailURL string     `json:"thumbnailUrl,omitempty"`
	Error        string     `json:"error,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	StartedAt    *time.Time `json:"startedAt,omitempty"`
	FinishedAt   *time.Time `json:"finishedAt,omitempty"`
}

type jobStore struct {
	mu   sync.Mutex
	jobs map[string]*transcodeJob
}

func newJobStore() *jobStore {
	return &jobStore{jobs: make(map[string]*transcodeJob)}
}

func (s *jobStore) createJob(input string, title string, presets []string) string {
	if input == "" {
		return ""
	}

	now := time.Now().UTC()
	job := &transcodeJob{
		ID:        fmt.Sprintf("job-%d", now.UnixNano()),
		Title:     title,
		Input:     input,
		Status:    jobStatusQueued,
		Presets:   normalizePresets(presets, "720p"),
		CreatedAt: now,
		UpdatedAt: now,
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	s.jobs[job.ID] = job
	return job.ID
}

func (s *jobStore) get(id string) (*transcodeJob, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	job, ok := s.jobs[id]
	return job, ok
}

func (s *jobStore) list() []*transcodeJob {
	s.mu.Lock()
	defer s.mu.Unlock()
	jobs := make([]*transcodeJob, 0, len(s.jobs))
	for _, job := range s.jobs {
		jobs = append(jobs, job)
	}
	sort.Slice(jobs, func(i, j int) bool {
		return jobs[i].CreatedAt.After(jobs[j].CreatedAt)
	})
	return jobs
}

func (s *jobStore) update(id string, fn func(*transcodeJob)) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	job, ok := s.jobs[id]
	if !ok {
		return false
	}
	fn(job)
	job.UpdatedAt = time.Now().UTC()
	return true
}

func main() {
	cfg := config.Load()
	var err error
	appStorage, err = storage.New(cfg)
	if err != nil {
		log.Fatalf("failed to initialize storage: %v", err)
	}
	if err := os.MkdirAll(cfg.LocalRootOrDefault(), 0o755); err != nil {
		log.Fatalf("failed to create uploads directory: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/api/health", healthHandler)
	mux.HandleFunc("/transcode", transcodeHandler)
	mux.HandleFunc("/api/transcode", transcodeHandler)
	mux.HandleFunc("/jobs", jobsHandler)
	mux.HandleFunc("/api/jobs", jobsHandler)
	mux.HandleFunc("/jobs/", jobDetailHandler)
	mux.HandleFunc("/api/jobs/", jobDetailHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	addr := fmt.Sprintf(":%s", port)
	log.Printf("video-engine listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "video-engine",
	})
}

func jobsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	writeJSON(w, http.StatusOK, defaultJobStore.list())
}

func jobDetailHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	jobID := strings.TrimPrefix(r.URL.Path, "/api/jobs/")
	jobID = strings.TrimPrefix(jobID, "/jobs/")
	jobID = strings.TrimPrefix(jobID, "/")
	if jobID == "" {
		http.Error(w, "job id required", http.StatusBadRequest)
		return
	}

	job, ok := defaultJobStore.get(jobID)
	if !ok {
		http.NotFound(w, r)
		return
	}
	writeJSON(w, http.StatusOK, job)
}

func transcodeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload transcodeRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	payload.Input = strings.TrimSpace(payload.Input)
	payload.Output = strings.TrimSpace(payload.Output)
	payload.Preset = strings.TrimSpace(payload.Preset)
	payload.Title = strings.TrimSpace(payload.Title)
	payload.Description = strings.TrimSpace(payload.Description)
	if payload.Input == "" {
		http.Error(w, "input is required", http.StatusBadRequest)
		return
	}

	inputPath := payload.Input
	if !filepath.IsAbs(inputPath) {
		inputPath = filepath.Join("/app/uploads", inputPath)
	}
	if _, err := os.Stat(inputPath); err != nil {
		http.Error(w, fmt.Sprintf("input file not found: %s", inputPath), http.StatusBadRequest)
		return
	}

	selectedPresets := normalizePresets(payload.Presets, payload.Preset)
	outputDir := outputDirectoryFor(payload.Output, payload.Title)
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		http.Error(w, fmt.Sprintf("failed to prepare output directory: %v", err), http.StatusInternalServerError)
		return
	}
	jobID := defaultJobStore.createJob(inputPath, payload.Title, selectedPresets)
	job, _ := defaultJobStore.get(jobID)
	job.Output = filepath.Join(outputDir, "master.m3u8")
	job.ManifestURL = strings.Replace(job.Output, "/app/uploads", "/uploads", 1)
	job.ThumbnailURL = strings.Replace(filepath.Join(outputDir, "thumbnail.jpg"), "/app/uploads", "/uploads", 1)

	go func() {
		if err := processTranscodeJob(jobID, appStorage); err != nil {
			defaultJobStore.update(jobID, func(j *transcodeJob) {
				j.Status = jobStatusFailed
				j.Error = err.Error()
				finished := time.Now().UTC()
				j.FinishedAt = &finished
			})
			return
		}
		defaultJobStore.update(jobID, func(j *transcodeJob) {
			j.Status = jobStatusCompleted
			j.Output = filepath.Join(outputDir, "master.m3u8")
			j.ManifestURL = strings.Replace(j.Output, "/app/uploads", "/uploads", 1)
			finished := time.Now().UTC()
			j.FinishedAt = &finished
		})
	}()

	writeJSON(w, http.StatusAccepted, map[string]any{
		"jobId":     jobID,
		"status":    jobStatusQueued,
		"title":     payload.Title,
		"input":     inputPath,
		"output":    job.Output,
		"presets":   job.Presets,
		"createdAt": job.CreatedAt,
	})
}

func processTranscodeJob(jobID string, storageSvc storage.Storage) error {
	job, ok := defaultJobStore.get(jobID)
	if !ok {
		return errors.New("job not found")
	}

	defaultJobStore.update(jobID, func(j *transcodeJob) {
		j.Status = jobStatusProcessing
		now := time.Now().UTC()
		j.StartedAt = &now
	})

	outputDir := filepath.Dir(job.Output)
	if outputDir == "" || outputDir == "." {
		outputDir = filepath.Join("/app/uploads", jobID)
	}
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		return fmt.Errorf("create output dir: %w", err)
	}

	thumbnailPath := filepath.Join(outputDir, "thumbnail.jpg")
	thumbArgs := []string{"-y", "-ss", "00:00:01", "-i", job.Input, "-vf", "scale=1280:-2:flags=lanczos", "-frames:v", "1", thumbnailPath}
	if err := runFFmpeg(thumbArgs); err != nil {
		return fmt.Errorf("generate thumbnail: %w", err)
	}
	defaultJobStore.update(jobID, func(j *transcodeJob) {
		j.ThumbnailURL = strings.Replace(thumbnailPath, "/app/uploads", "/uploads", 1)
	})

	variantFiles := make([]string, 0, len(job.Presets))
	for _, preset := range job.Presets {
		variantDir := filepath.Join(outputDir, preset)
		if err := os.MkdirAll(variantDir, 0o755); err != nil {
			return fmt.Errorf("create preset dir %s: %w", preset, err)
		}
		variantOutput := filepath.Join(variantDir, "playlist.m3u8")
		args, err := buildFFmpegArgs(job.Input, variantOutput, []string{preset})
		if err != nil {
			return fmt.Errorf("prepare args for %s: %w", preset, err)
		}
		if err := runFFmpeg(args); err != nil {
			return fmt.Errorf("transcode %s: %w", preset, err)
		}
		variantFiles = append(variantFiles, filepath.Join(preset, "playlist.m3u8"))
	}

	if len(variantFiles) > 0 {
		if err := writeMasterPlaylist(outputDir, variantFiles); err != nil {
			return fmt.Errorf("write master playlist: %w", err)
		}
	}

	defaultJobStore.update(jobID, func(j *transcodeJob) {
		j.Output = filepath.Join(outputDir, "master.m3u8")
		j.ManifestURL = strings.Replace(j.Output, "/app/uploads", "/uploads", 1)
	})
	if storageSvc != nil {
		if err := syncArtifactBundleToStorage(context.Background(), storageSvc, outputDir, jobID); err != nil {
			return fmt.Errorf("sync artifact bundle to storage: %w", err)
		}
		defaultJobStore.update(jobID, func(j *transcodeJob) {
			j.ManifestURL = storageSvc.URLFor(filepath.ToSlash(filepath.Join(jobID, "master.m3u8")))
			if j.ThumbnailURL != "" {
				j.ThumbnailURL = storageSvc.URLFor(filepath.ToSlash(filepath.Join(jobID, "thumbnail.jpg")))
			}
		})
	}
	return nil
}

func syncArtifactBundleToStorage(ctx context.Context, storageSvc storage.Storage, localDir string, jobID string) error {
	if storageSvc == nil {
		return nil
	}
	return filepath.Walk(localDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		relPath, err := filepath.Rel(localDir, path)
		if err != nil {
			return err
		}
		objectKey := filepath.ToSlash(filepath.Join(jobID, relPath))
		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()
		_, err = storageSvc.Save(ctx, objectKey, file, info.Size(), mime.TypeByExtension(filepath.Ext(path)))
		return err
	})
}

func writeMasterPlaylist(outputDir string, files []string) error {
	if len(files) == 0 {
		return errors.New("no variant files to write into master playlist")
	}
	lines := []string{"#EXTM3U"}
	for _, file := range files {
		lines = append(lines, fmt.Sprintf("#EXT-X-STREAM-INF:BANDWIDTH=8000000,RESOLUTION=%s", strings.TrimSuffix(filepath.Base(filepath.Dir(file)), ".m3u8")))
		lines = append(lines, file)
	}
	content := strings.Join(lines, "\n") + "\n"
	return os.WriteFile(filepath.Join(outputDir, "master.m3u8"), []byte(content), 0o644)
}

func buildFFmpegArgs(inputPath string, outputPath string, presets []string) ([]string, error) {
	if strings.TrimSpace(inputPath) == "" {
		return nil, errors.New("input path is required")
	}
	if strings.TrimSpace(outputPath) == "" {
		return nil, errors.New("output path is required")
	}

	selected := normalizePresets(presets, "720p")
	selectedPreset := selected[0]
	filter := resolveScaleFilter(selectedPreset)
	if outputPath == "" {
		outputPath = filepath.Join("/app/uploads", selectedPreset+".m3u8")
	}
	if err := os.MkdirAll(filepath.Dir(outputPath), 0o755); err != nil {
		return nil, err
	}

	args := []string{
		"-y",
		"-i", inputPath,
		"-vf", filter,
		"-c:v", "libx264",
		"-preset", "veryfast",
		"-crf", "28",
		"-c:a", "aac",
		"-f", "hls",
		"-hls_time", "6",
		"-hls_playlist_type", "vod",
		"-hls_flags", "independent_segments",
		"-metadata", "preset=" + strings.Join(selected, ","),
		outputPath,
	}
	return args, nil
}

func normalizePresets(presets []string, fallback string) []string {
	seen := make(map[string]struct{})
	ordered := make([]string, 0, len(presets)+1)
	for _, preset := range append([]string{fallback}, presets...) {
		trimmed := strings.TrimSpace(strings.ToLower(preset))
		if trimmed == "" {
			continue
		}
		if _, exists := seen[trimmed]; exists {
			continue
		}
		seen[trimmed] = struct{}{}
		ordered = append(ordered, trimmed)
	}
	if len(ordered) == 0 {
		ordered = []string{"720p"}
	}
	return ordered
}

func resolveScaleFilter(preset string) string {
	switch strings.ToLower(preset) {
	case "240p":
		return "scale=426:-2:flags=lanczos"
	case "360p":
		return "scale=640:-2:flags=lanczos"
	case "480p":
		return "scale=854:-2:flags=lanczos"
	case "720p":
		return "scale=1280:-2:flags=lanczos"
	case "1080p":
		return "scale=1920:-2:flags=lanczos"
	case "2160p":
		return "scale=3840:-2:flags=lanczos"
	default:
		return "scale=1280:-2:flags=lanczos"
	}
}

func runFFmpeg(args []string) error {
	cmd := exec.Command("ffmpeg", args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("%w: %s", err, strings.TrimSpace(string(output)))
	}
	return nil
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("failed to encode JSON response: %v", err)
	}
}

func outputDirectoryFor(output string, title string) string {
	trimmedTitle := strings.TrimSpace(title)
	if trimmedTitle == "" {
		trimmedTitle = "video"
	}
	baseDir := "/app/uploads"
	if output != "" {
		candidate := strings.TrimSpace(output)
		if filepath.IsAbs(candidate) {
			baseDir = filepath.Dir(candidate)
			if baseDir == "." || baseDir == "" {
				baseDir = "/app/uploads"
			}
			return baseDir
		}
		if filepath.Dir(candidate) != "." {
			baseDir = filepath.Join("/app/uploads", filepath.Dir(candidate))
		}
	}
	return filepath.Join(baseDir, sanitizeOutputName(trimmedTitle))
}

func sanitizeOutputName(name string) string {
	cleaned := strings.ToLower(name)
	cleaned = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' || r == '_' || r == '.' {
			return r
		}
		return '-'
	}, cleaned)
	cleaned = strings.Trim(cleaned, "-._")
	if cleaned == "" {
		return "video"
	}
	return cleaned
}
