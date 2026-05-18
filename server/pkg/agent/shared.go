package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"strings"
)

func trySend(ch chan<- Message, msg Message) {
	select {
	case ch <- msg:
	default:
	}
}

func buildEnv(extra map[string]string) []string {
	env := os.Environ()
	result := make([]string, 0, len(env)+len(extra))
	for _, entry := range env {
		key, _, _ := strings.Cut(entry, "=")
		if key == "CLAUDECODE" || strings.HasPrefix(key, "CLAUDECODE_") || strings.HasPrefix(key, "CLAUDE_CODE_") {
			continue
		}
		result = append(result, entry)
	}
	for k, v := range extra {
		result = append(result, k+"="+v)
	}
	return result
}

type logWriter struct {
	logger *slog.Logger
	prefix string
}

func newLogWriter(logger *slog.Logger, prefix string) *logWriter {
	return &logWriter{logger: logger, prefix: prefix}
}

func (w *logWriter) Write(p []byte) (int, error) {
	text := strings.TrimSpace(string(p))
	if text != "" {
		w.logger.Debug(w.prefix + text)
	}
	return len(p), nil
}

func detectCLIVersion(ctx context.Context, execPath string) (string, error) {
	cmd := exec.CommandContext(ctx, execPath, "--version")
	data, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("detect version for %s: %w", execPath, err)
	}
	return strings.TrimSpace(string(data)), nil
}

type pendingRPC struct {
	ch     chan rpcResult
	method string
}

type rpcResult struct {
	result json.RawMessage
	err    error
}
