package storage

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	vconfig "github.com/edvance/video-engine/internal/config"
)

type S3Storage struct {
	client         *s3.Client
	bucket         string
	region         string
	endpoint       string
	forcePathStyle bool
}

func NewS3(cfg vconfig.Config) (Storage, error) {
	if err := ensureS3Config(cfg); err != nil {
		return nil, err
	}

	awsCfg, err := config.LoadDefaultConfig(context.Background(), config.WithRegion(cfg.S3Region))
	if err != nil {
		return nil, fmt.Errorf("load AWS config: %w", err)
	}
	if cfg.S3AccessKeyID != "" && cfg.S3SecretAccessKey != "" {
		awsCfg.Credentials = aws.CredentialsProviderFunc(func(ctx context.Context) (aws.Credentials, error) {
			return aws.Credentials{AccessKeyID: cfg.S3AccessKeyID, SecretAccessKey: cfg.S3SecretAccessKey, Source: "video-engine"}, nil
		})
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = cfg.S3ForcePathStyle || cfg.S3Endpoint != ""
		if cfg.S3Endpoint != "" {
			o.BaseEndpoint = aws.String(strings.TrimRight(cfg.S3Endpoint, "/"))
		}
		if cfg.S3Region != "" {
			o.Region = cfg.S3Region
		}
	})
	return &S3Storage{client: client, bucket: cfg.S3Bucket, region: cfg.S3Region, endpoint: cfg.S3Endpoint, forcePathStyle: cfg.S3ForcePathStyle || cfg.S3Endpoint != ""}, nil
}

func (s *S3Storage) Save(ctx context.Context, key string, reader io.Reader, size int64, contentType string) (string, error) {
	cleanKey := sanitizeObjectKey(key)
	contentLength := size
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(s.bucket),
		Key:           aws.String(cleanKey),
		Body:          reader,
		ContentType:   aws.String(contentType),
		ContentLength: &contentLength,
	})
	if err != nil {
		return "", fmt.Errorf("write object to s3: %w", err)
	}
	return s.URLFor(cleanKey), nil
}

func (s *S3Storage) URLFor(key string) string {
	cleanKey := sanitizeObjectKey(key)
	escapedKey := escapeObjectKey(cleanKey)
	escapedBucket := url.PathEscape(s.bucket)
	if s.endpoint != "" {
		base := strings.TrimRight(s.endpoint, "/")
		return fmt.Sprintf("%s/%s/%s", base, escapedBucket, escapedKey)
	}
	if s.forcePathStyle {
		if s.region == "" {
			return fmt.Sprintf("https://s3.amazonaws.com/%s/%s", escapedBucket, escapedKey)
		}
		return fmt.Sprintf("https://s3.%s.amazonaws.com/%s/%s", s.region, escapedBucket, escapedKey)
	}
	if s.region == "" {
		return fmt.Sprintf("https://%s.s3.amazonaws.com/%s", s.bucket, escapedKey)
	}
	return fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", s.bucket, s.region, escapedKey)
}

func escapeObjectKey(key string) string {
	segments := strings.Split(key, "/")
	for index, segment := range segments {
		segments[index] = url.PathEscape(segment)
	}
	return strings.Join(segments, "/")
}
