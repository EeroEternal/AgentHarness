package storage

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
)

// LocalStorage stores files on the local filesystem.
// Used as a fallback when no S3 bucket is configured.
type LocalStorage struct {
	dir string
}

// NewLocalStorage creates a LocalStorage rooted at dir.
// The directory is created if it does not exist.
func NewLocalStorage(dir string) (*LocalStorage, error) {
	absDir, err := filepath.Abs(dir)
	if err != nil {
		return nil, fmt.Errorf("local storage: resolve dir: %w", err)
	}
	if err := os.MkdirAll(absDir, 0o755); err != nil {
		return nil, fmt.Errorf("local storage: mkdir: %w", err)
	}
	slog.Info("local storage initialized", "dir", absDir)
	return &LocalStorage{dir: absDir}, nil
}

func (s *LocalStorage) Upload(_ context.Context, key string, data []byte, _ string, _ string) (string, error) {
	dst := filepath.Join(s.dir, key)
	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return "", fmt.Errorf("local upload: mkdir: %w", err)
	}
	if err := os.WriteFile(dst, data, 0o644); err != nil {
		return "", fmt.Errorf("local upload: write: %w", err)
	}
	// Return a file:// URL so it can be served via the attachment proxy.
	return fmt.Sprintf("file://%s", dst), nil
}

func (s *LocalStorage) Download(_ context.Context, key string) ([]byte, error) {
	path := filepath.Join(s.dir, key)
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("local download: %w", err)
	}
	return data, nil
}

func (s *LocalStorage) Delete(_ context.Context, key string) {
	if key == "" {
		return
	}
	path := filepath.Join(s.dir, key)
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		slog.Error("local delete failed", "key", key, "error", err)
	}
}

func (s *LocalStorage) DeleteKeys(ctx context.Context, keys []string) {
	for _, key := range keys {
		s.Delete(ctx, key)
	}
}

// KeyFromURL extracts the key from a file:// URL.
// e.g. "file:///data/uploads/abc123.png" -> "abc123.png"
func (s *LocalStorage) KeyFromURL(rawURL string) string {
	trimmed := strings.TrimPrefix(rawURL, "file://")
	trimmed = strings.TrimPrefix(trimmed, s.dir)
	trimmed = strings.TrimPrefix(trimmed, "/")
	return trimmed
}
