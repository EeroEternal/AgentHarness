package agent

import (
	"context"
	"testing"
)

func TestNewReturnsOpenCodeBackend(t *testing.T) {
	t.Parallel()
	b, err := New("opencode", Config{ExecutablePath: "/nonexistent/opencode"})
	if err != nil {
		t.Fatalf("New(opencode) error: %v", err)
	}
	if _, ok := b.(*opencodeBackend); !ok {
		t.Fatalf("expected *opencodeBackend, got %T", b)
	}
}

func TestNewRejectsUnknownType(t *testing.T) {
	t.Parallel()
	_, err := New("gpt", Config{})
	if err == nil {
		t.Fatal("expected error for unknown agent type")
	}
}

func TestNewDefaultsLogger(t *testing.T) {
	t.Parallel()
	b, _ := New("opencode", Config{})
	ob := b.(*opencodeBackend)
	if ob.cfg.Logger == nil {
		t.Fatal("expected non-nil logger")
	}
}

func TestDetectVersionFailsForMissingBinary(t *testing.T) {
	t.Parallel()
	_, err := DetectVersion(context.Background(), "/nonexistent/binary")
	if err == nil {
		t.Fatal("expected error for missing binary")
	}
}
