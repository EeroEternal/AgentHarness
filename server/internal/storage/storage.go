package storage

import "context"

// Storage defines the interface for file storage backends.
type Storage interface {
	Upload(ctx context.Context, key string, data []byte, contentType string, filename string) (string, error)
	Download(ctx context.Context, key string) ([]byte, error)
	Delete(ctx context.Context, key string)
	DeleteKeys(ctx context.Context, keys []string)
	KeyFromURL(rawURL string) string
}
