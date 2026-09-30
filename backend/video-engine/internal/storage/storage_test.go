package storage

import "testing"

func TestSanitizeObjectKeyPreventsTraversal(t *testing.T) {
	tests := []struct {
		name string
		key  string
		want string
	}{
		{name: "parent segments", key: "../outside\\video.mp4", want: "_/outside/video.mp4"},
		{name: "repeated separators", key: "/jobs//job-1/./master.m3u8", want: "jobs/job-1/master.m3u8"},
		{name: "empty key", key: "  ", want: "uploads"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := sanitizeObjectKey(test.key); got != test.want {
				t.Fatalf("sanitizeObjectKey(%q) = %q, want %q", test.key, got, test.want)
			}
		})
	}
}

func TestS3URLForEscapesKeysAndUsesConfiguredAddressingStyle(t *testing.T) {
	tests := []struct {
		name    string
		storage S3Storage
		key     string
		want    string
	}{
		{
			name:    "custom endpoint",
			storage: S3Storage{bucket: "media", endpoint: "http://localhost:9000/"},
			key:     "jobs/job-1/episode #1.m3u8",
			want:    "http://localhost:9000/media/jobs/job-1/episode%20%231.m3u8",
		},
		{
			name:    "aws path style",
			storage: S3Storage{bucket: "media", region: "us-east-1", forcePathStyle: true},
			key:     "jobs/job-1/master.m3u8",
			want:    "https://s3.us-east-1.amazonaws.com/media/jobs/job-1/master.m3u8",
		},
		{
			name:    "aws virtual hosted style",
			storage: S3Storage{bucket: "media", region: "us-east-1"},
			key:     "jobs/job-1/master.m3u8",
			want:    "https://media.s3.us-east-1.amazonaws.com/jobs/job-1/master.m3u8",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := test.storage.URLFor(test.key); got != test.want {
				t.Fatalf("URLFor(%q) = %q, want %q", test.key, got, test.want)
			}
		})
	}
}
