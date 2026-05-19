package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
)

func Encrypt(plaintext string, masterKeyHex string) (string, error) {
	key, err := hex.DecodeString(masterKeyHex)
	if err != nil {
		return "", fmt.Errorf("crypto: invalid master key hex: %w", err)
	}
	if len(key) != 32 {
		return "", fmt.Errorf("crypto: master key must be 32 bytes (64 hex chars), got %d bytes", len(key))
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("crypto: new cipher: %w", err)
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("crypto: new GCM: %w", err)
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("crypto: generate nonce: %w", err)
	}

	ciphertext := aesGCM.Seal(nil, nonce, []byte(plaintext), nil)
	return hex.EncodeToString(nonce) + hex.EncodeToString(ciphertext), nil
}

func Decrypt(encoded string, masterKeyHex string) (string, error) {
	key, err := hex.DecodeString(masterKeyHex)
	if err != nil {
		return "", fmt.Errorf("crypto: invalid master key hex: %w", err)
	}
	if len(key) != 32 {
		return "", fmt.Errorf("crypto: master key must be 32 bytes (64 hex chars), got %d bytes", len(key))
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("crypto: new cipher: %w", err)
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("crypto: new GCM: %w", err)
	}

	nonceSize := aesGCM.NonceSize()
	raw, err := hex.DecodeString(encoded)
	if err != nil {
		return "", fmt.Errorf("crypto: decode hex: %w", err)
	}
	if len(raw) < nonceSize {
		return "", fmt.Errorf("crypto: encoded data too short")
	}

	nonce, ciphertext := raw[:nonceSize], raw[nonceSize:]
	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("crypto: decrypt: %w", err)
	}
	return string(plaintext), nil
}
