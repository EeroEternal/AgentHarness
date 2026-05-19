package crypto

import (
	"testing"
)

func TestEncryptDecrypt(t *testing.T) {
	masterKey := "dba22b88259d7fc50a9b7e8be47429d36e4442b1e6c945143fa7013b1d57c767"
	original := "sk-ant-test-key-12345"

	encoded, err := Encrypt(original, masterKey)
	if err != nil {
		t.Fatalf("Encrypt failed: %v", err)
	}

	decoded, err := Decrypt(encoded, masterKey)
	if err != nil {
		t.Fatalf("Decrypt failed: %v", err)
	}

	if decoded != original {
		t.Fatalf("round-trip mismatch: got %q, want %q", decoded, original)
	}
}

func TestEncryptProducesDifferentOutput(t *testing.T) {
	masterKey := "dba22b88259d7fc50a9b7e8be47429d36e4442b1e6c945143fa7013b1d57c767"
	key := "sk-ant-test-key-12345"

	out1, _ := Encrypt(key, masterKey)
	out2, _ := Encrypt(key, masterKey)

	if out1 == out2 {
		t.Fatal("expected different ciphertexts due to random nonce")
	}
}

func TestInvalidMasterKey(t *testing.T) {
	if _, err := Encrypt("test", "invalid"); err == nil {
		t.Fatal("expected error for invalid hex key")
	}
	if _, err := Encrypt("test", "aabb"); err == nil {
		t.Fatal("expected error for short key")
	}
}
