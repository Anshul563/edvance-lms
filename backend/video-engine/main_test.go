package main

import (
	"strings"
	"testing"
)

func TestBuildFFmpegArgsIncludesHLSAndResolutions(t *testing.T) {
	args, err := buildFFmpegArgs("/tmp/input.mp4", "/tmp/output", []string{"360p", "720p"})
	if err != nil {
		t.Fatalf("buildFFmpegArgs returned error: %v", err)
	}

	joined := strings.Join(args, " ")
	if !strings.Contains(joined, "-f hls") {
		t.Fatalf("expected HLS output in args, got %q", joined)
	}
	if !strings.Contains(joined, "360p") && !strings.Contains(joined, "720p") {
		t.Fatalf("expected resolution preset in args, got %q", joined)
	}
}

func TestNewJobStoreTracksJobLifecycle(t *testing.T) {
	store := newJobStore()
	jobID := store.createJob("demo.mp4", "demo.mp4", []string{"720p"})
	if jobID == "" {
		t.Fatal("expected non-empty job ID")
	}

	job, ok := store.get(jobID)
	if !ok {
		t.Fatal("expected job to exist")
	}
	if job.Status != jobStatusQueued {
		t.Fatalf("expected queued status, got %q", job.Status)
	}
	if len(job.Presets) != 1 || job.Presets[0] != "720p" {
		t.Fatalf("unexpected job presets: %#v", job.Presets)
	}
}
