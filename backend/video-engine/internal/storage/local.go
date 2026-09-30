package storage

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"

	"github.com/edvance/video-engine/internal/config"
)

type LocalStorage struct {
	root string
}

func NewLocal(cfg config.Config) (Storage, error) {
	root := cfg.LocalRootOrDefault()
	if err := ensureParentDir(filepath.Join(root, "placeholder")); err != nil {
		return nil, err
	}
	return &LocalStorage{root: root}, nil
}

func (s *LocalStorage) Save(ctx context.Context, key string, reader io.Reader, size int64, contentType string) (string, error) {
	_ = ctx
	_ = size
	_ = contentType
	cleanKey := sanitizeObjectKey(key)
	path := filepath.Join(s.root, cleanKey)
	if err := ensureParentDir(path); err != nil {
		return "", err
	}
	if err := copyReaderToFile(reader, path); err != nil {
		return "", err
	}
	return s.URLFor(cleanKey), nil
}

func (s *LocalStorage) URLFor(key string) string {
	cleanKey := sanitizeObjectKey(key)
	return fmt.Sprintf("/uploads/%s", strings.TrimPrefix(cleanKey, "/"))
}
