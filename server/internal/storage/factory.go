package storage

import (
	"log/slog"
	"os"
	"path/filepath"
)

const defaultLocalDir = "./uploads"

// NewStorageFromEnv creates a Storage backend based on environment configuration.
// Returns S3 storage if S3_BUCKET is set, otherwise falls back to local disk storage.
//
// Local storage directory can be configured via LOCAL_STORAGE_DIR (default: ./uploads).
func NewStorageFromEnv() Storage {
	if s3 := NewS3StorageFromEnv(); s3 != nil {
		return s3
	}

	dir := os.Getenv("LOCAL_STORAGE_DIR")
	if dir == "" {
		home, err := os.UserHomeDir()
		if err == nil {
			dir = filepath.Join(home, ".multica", "uploads")
		} else {
			dir = defaultLocalDir
		}
	}

	slog.Info("S3_BUCKET not set, falling back to local file storage", "dir", dir)
	local, err := NewLocalStorage(dir)
	if err != nil {
		slog.Error("failed to create local storage, file upload will be unavailable", "error", err)
		return nil
	}
	return local
}
