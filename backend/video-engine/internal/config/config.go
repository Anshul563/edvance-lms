package config

import (
	"os"
	"strconv"
	"strings"
)

// Config contains environment-driven runtime settings for the video engine.
type Config struct {
	Port              string
	StorageMode       string
	LocalStorageRoot  string
	S3Bucket          string
	S3Region          string
	S3Endpoint        string
	S3AccessKeyID     string
	S3SecretAccessKey string
	S3ForcePathStyle  bool
}

func Load() Config {
	storageMode := strings.ToLower(strings.TrimSpace(os.Getenv("STORAGE_MODE")))
	if storageMode == "" {
		storageMode = "local"
	}

	forcePathStyle, _ := strconv.ParseBool(strings.TrimSpace(os.Getenv("S3_FORCE_PATH_STYLE")))

	return Config{
		Port:              strings.TrimSpace(os.Getenv("PORT")),
		StorageMode:       storageMode,
		LocalStorageRoot:  strings.TrimSpace(os.Getenv("LOCAL_STORAGE_ROOT")),
		S3Bucket:          strings.TrimSpace(os.Getenv("S3_BUCKET")),
		S3Region:          strings.TrimSpace(os.Getenv("S3_REGION")),
		S3Endpoint:        strings.TrimSpace(os.Getenv("S3_ENDPOINT")),
		S3AccessKeyID:     strings.TrimSpace(os.Getenv("S3_ACCESS_KEY_ID")),
		S3SecretAccessKey: strings.TrimSpace(os.Getenv("S3_SECRET_ACCESS_KEY")),
		S3ForcePathStyle:  forcePathStyle,
	}
}

func (c Config) PortOrDefault() string {
	if c.Port == "" {
		return "8080"
	}
	return c.Port
}

func (c Config) LocalRootOrDefault() string {
	if c.LocalStorageRoot == "" {
		return "/app/uploads"
	}
	return c.LocalStorageRoot
}
