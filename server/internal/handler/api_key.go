package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/multica-ai/multica/server/internal/crypto"
	db "github.com/multica-ai/multica/server/pkg/db/generated"
)

type APIKeyResponse struct {
	KeyName     string `json:"key_name"`
	MaskedValue string `json:"masked_value"`
	Scope       string `json:"scope"`
}

type apiKeyPutRequest struct {
	Keys map[string]string `json:"keys"`
}

func maskAPIKeyValue(v string) string {
	if len(v) <= 8 {
		return "****"
	}
	return v[:4] + "****" + v[len(v)-4:]
}

func (h *Handler) getEncryptionKey(r *http.Request) (string, bool) {
	key := r.Header.Get("X-Encryption-Key")
	if key != "" {
		return key, true
	}
	if h.EncryptionKey != "" {
		return h.EncryptionKey, true
	}
	return "", false
}

func (h *Handler) ListWorkspaceAPIKeys(w http.ResponseWriter, r *http.Request) {
	workspaceID := workspaceIDFromURL(r, "id")
	if workspaceID == "" {
		writeError(w, http.StatusBadRequest, "workspace_id is required")
		return
	}

	keys, err := h.Queries.ListWorkspaceAPIKeys(r.Context(), parseUUID(workspaceID))
	if err != nil {
		slog.Error("list workspace api keys", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list API keys")
		return
	}

	resp := make([]APIKeyResponse, 0, len(keys))
	for _, k := range keys {
		resp = append(resp, APIKeyResponse{
			KeyName:     k.KeyName,
			MaskedValue: maskAPIKeyValue(k.EncryptedValue),
			Scope:       "workspace",
		})
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) PutWorkspaceAPIKeys(w http.ResponseWriter, r *http.Request) {
	workspaceID := workspaceIDFromURL(r, "id")
	if workspaceID == "" {
		writeError(w, http.StatusBadRequest, "workspace_id is required")
		return
	}

	masterKey, ok := h.getEncryptionKey(r)
	if !ok {
		writeError(w, http.StatusBadRequest, "X-Encryption-Key header required")
		return
	}

	var req apiKeyPutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.Queries.DeleteAllWorkspaceAPIKeys(r.Context(), parseUUID(workspaceID)); err != nil {
		slog.Error("delete all workspace api keys", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to save API keys")
		return
	}

	member, ok := ctxMember(r.Context())
	if !ok {
		writeError(w, http.StatusInternalServerError, "member not found")
		return
	}

	for name, value := range req.Keys {
		encrypted, err := crypto.Encrypt(value, masterKey)
		if err != nil {
			slog.Error("encrypt api key", "key_name", name, "error", err)
			writeError(w, http.StatusInternalServerError, "encryption failed")
			return
		}
		if _, err := h.Queries.UpsertWorkspaceAPIKey(r.Context(), db.UpsertWorkspaceAPIKeyParams{
			WorkspaceID:    parseUUID(workspaceID),
			KeyName:        name,
			EncryptedValue: encrypted,
			CreatedBy:      member.ID,
		}); err != nil {
			slog.Error("upsert workspace api key", "key_name", name, "error", err)
			writeError(w, http.StatusInternalServerError, "failed to save API key")
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) DeleteWorkspaceAPIKey(w http.ResponseWriter, r *http.Request) {
	workspaceID := workspaceIDFromURL(r, "id")
	keyName := chi.URLParam(r, "keyName")
	if workspaceID == "" || keyName == "" {
		writeError(w, http.StatusBadRequest, "workspace_id and key_name are required")
		return
	}

	if err := h.Queries.DeleteWorkspaceAPIKey(r.Context(), db.DeleteWorkspaceAPIKeyParams{
		WorkspaceID: parseUUID(workspaceID),
		KeyName:     keyName,
	}); err != nil {
		slog.Error("delete workspace api key", "key_name", keyName, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to delete API key")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) ListAgentAPIKeys(w http.ResponseWriter, r *http.Request) {
	agentID := chi.URLParam(r, "id")
	if agentID == "" {
		writeError(w, http.StatusBadRequest, "agent_id is required")
		return
	}

	agent, ok := h.loadAgentForUser(w, r, agentID)
	if !ok {
		return
	}

	keys, err := h.Queries.ListAgentAPIKeys(r.Context(), db.ListAgentAPIKeysParams{
		WorkspaceID: agent.WorkspaceID,
		AgentID:     agent.ID,
	})
	if err != nil {
		slog.Error("list agent api keys", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list API keys")
		return
	}

	resp := make([]APIKeyResponse, 0, len(keys))
	for _, k := range keys {
		resp = append(resp, APIKeyResponse{
			KeyName:     k.KeyName,
			MaskedValue: maskAPIKeyValue(k.EncryptedValue),
			Scope:       "agent",
		})
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) PutAgentAPIKeys(w http.ResponseWriter, r *http.Request) {
	agentID := chi.URLParam(r, "id")
	if agentID == "" {
		writeError(w, http.StatusBadRequest, "agent_id is required")
		return
	}

	agent, ok := h.loadAgentForUser(w, r, agentID)
	if !ok {
		return
	}

	masterKey, ok := h.getEncryptionKey(r)
	if !ok {
		writeError(w, http.StatusBadRequest, "X-Encryption-Key header required")
		return
	}

	var req apiKeyPutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.Queries.DeleteAllAgentAPIKeys(r.Context(), db.DeleteAllAgentAPIKeysParams{
		WorkspaceID: agent.WorkspaceID,
		AgentID:     agent.ID,
	}); err != nil {
		slog.Error("delete all agent api keys", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to save API keys")
		return
	}

	for name, value := range req.Keys {
		encrypted, err := crypto.Encrypt(value, masterKey)
		if err != nil {
			slog.Error("encrypt api key", "key_name", name, "error", err)
			writeError(w, http.StatusInternalServerError, "encryption failed")
			return
		}
		if _, err := h.Queries.UpsertAgentAPIKey(r.Context(), db.UpsertAgentAPIKeyParams{
			WorkspaceID:    agent.WorkspaceID,
			AgentID:        agent.ID,
			KeyName:        name,
			EncryptedValue: encrypted,
			CreatedBy:      parseUUID(requestUserID(r)),
		}); err != nil {
			slog.Error("upsert agent api key", "key_name", name, "error", err)
			writeError(w, http.StatusInternalServerError, "failed to save API key")
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) DeleteAgentAPIKey(w http.ResponseWriter, r *http.Request) {
	agentID := chi.URLParam(r, "id")
	keyName := chi.URLParam(r, "keyName")
	if agentID == "" || keyName == "" {
		writeError(w, http.StatusBadRequest, "agent_id and key_name are required")
		return
	}

	agent, ok := h.loadAgentForUser(w, r, agentID)
	if !ok {
		return
	}

	if err := h.Queries.DeleteAgentAPIKey(r.Context(), db.DeleteAgentAPIKeyParams{
		WorkspaceID: agent.WorkspaceID,
		KeyName:     keyName,
		AgentID:     agent.ID,
	}); err != nil {
		slog.Error("delete agent api key", "key_name", keyName, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to delete API key")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) GetEffectiveAPIKeys(w http.ResponseWriter, r *http.Request) {
	agentID := chi.URLParam(r, "id")
	if agentID == "" {
		writeError(w, http.StatusBadRequest, "agent_id is required")
		return
	}

	masterKey, ok := h.getEncryptionKey(r)
	if !ok {
		writeError(w, http.StatusBadRequest, "X-Encryption-Key header required")
		return
	}

	agent, err := h.Queries.GetAgent(r.Context(), parseUUID(agentID))
	if err != nil {
		writeError(w, http.StatusNotFound, "agent not found")
		return
	}

	keys, err := h.Queries.GetEffectiveAPIKeys(r.Context(), db.GetEffectiveAPIKeysParams{
		WorkspaceID: agent.WorkspaceID,
		AgentID:     agent.ID,
	})
	if err != nil {
		slog.Error("get effective api keys", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to get API keys")
		return
	}

	result := make(map[string]string, len(keys))
	for _, k := range keys {
		plaintext, err := crypto.Decrypt(k.EncryptedValue, masterKey)
		if err != nil {
			slog.Error("decrypt api key", "key_name", k.KeyName, "error", err)
			continue
		}
		result[k.KeyName] = plaintext
	}

	writeJSON(w, http.StatusOK, result)
}
