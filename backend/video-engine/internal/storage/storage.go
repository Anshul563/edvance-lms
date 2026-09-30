package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/edvance/video-engine/internal/config"
)

// Storage abstracts file persistence so uploads and output manifests can live in
// either a local filesystem or S3-compatible object storage.
type Storage interface {
	Save(ctx context.Context, key string, reader io.Reader, size int64, contentType string) (string, error)
	URLFor(key string) string
}

func New(cfg config.Config) (Storage, error) {
	switch strings.ToLower(cfg.StorageMode) {
	case "s3":
		return NewS3(cfg)
	case "local", "":
		if cfg.LocalStorageRoot == "" {
			cfg.LocalStorageRoot = "/app/uploads"
		}
		return NewLocal(cfg)
	default:
		return nil, fmt.Errorf("unsupported storage mode: %s", cfg.StorageMode)
	}
}

func sanitizeObjectKey(key string) string {
	cleaned := strings.TrimSpace(key)
	if cleaned == "" {
		return "uploads"
	}
	cleaned = strings.ReplaceAll(cleaned, "\\", "/")
	segments := strings.Split(cleaned, "/")
	cleanSegments := make([]string, 0, len(segments))
	for _, segment := range segments {
		switch segment {
		case "", ".":
			continue
		case "..":
			cleanSegments = append(cleanSegments, "_")
		default:
			cleanSegments = append(cleanSegments, segment)
		}
	}
	if len(cleanSegments) == 0 {
		return "uploads"
	}
	return filepath.ToSlash(strings.Join(cleanSegments, "/"))
}

func ensureParentDir(path string) error {
	return os.MkdirAll(filepath.Dir(path), 0o755)
}

func detectContentType(name string) string {
	switch strings.ToLower(filepath.Ext(name)) {
	case ".m3u8":
		return "application/vnd.apple.mpegurl"
	case ".ts":
		return "video/mp2t"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".mp4":
		return "video/mp4"
	default:
		return "application/octet-stream"
	}
}

func copyReaderToFile(reader io.Reader, destination string) error {
	if err := ensureParentDir(destination); err != nil {
		return err
	}
	file, err := os.Create(destination)
	if err != nil {
		return err
	}
	defer file.Close()
	if _, err := io.Copy(file, reader); err != nil {
		return err
	}
	return file.Close()
}

func persistLocalCopy(root string, key string, reader io.Reader) (string, error) {
	path := filepath.Join(root, sanitizeObjectKey(key))
	if err := copyReaderToFile(reader, path); err != nil {
		return "", err
	}
	return "/uploads/" + sanitizeObjectKey(key), nil
}

func ensureS3Config(cfg config.Config) error {
	if strings.ToLower(cfg.StorageMode) != "s3" {
		return nil
	}
	if cfg.S3Bucket == "" {
		return errors.New("S3_BUCKET is required when STORAGE_MODE=s3")
	}
	if cfg.S3Region == "" && cfg.S3Endpoint == "" {
		return errors.New("S3_REGION or S3_ENDPOINT must be set when STORAGE_MODE=s3")
	}
	return nil
}
