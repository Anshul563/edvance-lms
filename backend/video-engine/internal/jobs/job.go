package jobs

import (
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"
)

const (
	Queued     = "queued"
	Processing = "processing"
	Completed  = "completed"
	Failed     = "failed"
)

type Job struct {
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

type Store struct {
	mu   sync.Mutex
	jobs map[string]*Job
}

func NewStore() *Store {
	return &Store{jobs: make(map[string]*Job)}
}

func (s *Store) Create(input string, title string, presets []string) string {
	if input == "" {
		return ""
	}
	now := time.Now().UTC()
	job := &Job{
		ID:        fmt.Sprintf("job-%d", now.UnixNano()),
		Title:     title,
		Input:     input,
		Status:    Queued,
		Presets:   normalizePresets(presets, "720p"),
		CreatedAt: now,
		UpdatedAt: now,
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	s.jobs[job.ID] = job
	return job.ID
}

func (s *Store) Get(id string) (*Job, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	job, ok := s.jobs[id]
	return job, ok
}

func (s *Store) Update(id string, fn func(*Job)) bool {
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

func (s *Store) List() []*Job {
	s.mu.Lock()
	defer s.mu.Unlock()
	jobs := make([]*Job, 0, len(s.jobs))
	for _, job := range s.jobs {
		jobs = append(jobs, job)
	}
	sort.Slice(jobs, func(i, j int) bool {
		return jobs[i].CreatedAt.After(jobs[j].CreatedAt)
	})
	return jobs
}

func normalizePresets(presets []string, fallback string) []string {
	seen := map[string]struct{}{}
	out := make([]string, 0, len(presets)+1)
	for _, preset := range append([]string{fallback}, presets...) {
		value := strings.TrimSpace(strings.ToLower(preset))
		if value == "" {
			continue
		}
		if _, exists := seen[value]; exists {
			continue
		}
		seen[value] = struct{}{}
		out = append(out, value)
	}
	if len(out) == 0 {
		return []string{"720p"}
	}
	return out
}
