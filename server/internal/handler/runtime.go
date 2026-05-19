package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/multica-ai/multica/server/pkg/db/generated"
	"github.com/multica-ai/multica/server/pkg/protocol"
)

type AgentRuntimeResponse struct {
	ID          string  `json:"id"`
	WorkspaceID string  `json:"workspace_id"`
	DaemonID    *string `json:"daemon_id"`
	Name        string  `json:"name"`
	RuntimeMode string  `json:"runtime_mode"`
	Provider    string  `json:"provider"`
	Status      string  `json:"status"`
	DeviceInfo  string  `json:"device_info"`
	Metadata    any     `json:"metadata"`
	OwnerID     *string `json:"owner_id"`
	LastSeenAt  *string `json:"last_seen_at"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

func runtimeToResponse(rt db.AgentRuntime) AgentRuntimeResponse {
	var metadata any
	if rt.Metadata != nil {
		json.Unmarshal(rt.Metadata, &metadata)
	}
	if metadata == nil {
		metadata = map[string]any{}
	}

	return AgentRuntimeResponse{
		ID:          uuidToString(rt.ID),
		WorkspaceID: uuidToString(rt.WorkspaceID),
		DaemonID:    textToPtr(rt.DaemonID),
		Name:        rt.Name,
		RuntimeMode: rt.RuntimeMode,
		Provider:    rt.Provider,
		Status:      rt.Status,
		DeviceInfo:  rt.DeviceInfo,
		Metadata:    metadata,
		OwnerID:     uuidToPtr(rt.OwnerID),
		LastSeenAt:  timestampToPtr(rt.LastSeenAt),
		CreatedAt:   timestampToString(rt.CreatedAt),
		UpdatedAt:   timestampToString(rt.UpdatedAt),
	}
}

// ---------------------------------------------------------------------------
// Runtime Usage
// ---------------------------------------------------------------------------

type RuntimeUsageEntry struct {
	Date             string `json:"date"`
	Provider         string `json:"provider"`
	Model            string `json:"model"`
	InputTokens      int64  `json:"input_tokens"`
	OutputTokens     int64  `json:"output_tokens"`
	CacheReadTokens  int64  `json:"cache_read_tokens"`
	CacheWriteTokens int64  `json:"cache_write_tokens"`
}

type RuntimeUsageResponse struct {
	RuntimeID        string `json:"runtime_id"`
	Date             string `json:"date"`
	Provider         string `json:"provider"`
	Model            string `json:"model"`
	InputTokens      int64  `json:"input_tokens"`
	OutputTokens     int64  `json:"output_tokens"`
	CacheReadTokens  int64  `json:"cache_read_tokens"`
	CacheWriteTokens int64  `json:"cache_write_tokens"`
}

// ReportRuntimeUsage receives usage data from the daemon.
func (h *Handler) ReportRuntimeUsage(w http.ResponseWriter, r *http.Request) {
	runtimeID := chi.URLParam(r, "runtimeId")
	if runtimeID == "" {
		writeError(w, http.StatusBadRequest, "runtimeId is required")
		return
	}

	// Verify the caller owns this runtime's workspace.
	if _, ok := h.requireDaemonRuntimeAccess(w, r, runtimeID); !ok {
		return
	}

	var req struct {
		Entries []RuntimeUsageEntry `json:"entries"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	for _, entry := range req.Entries {
		date, err := time.Parse("2006-01-02", entry.Date)
		if err != nil {
			continue
		}
		h.Queries.UpsertRuntimeUsage(r.Context(), db.UpsertRuntimeUsageParams{
			RuntimeID:        parseUUID(runtimeID),
			Date:             pgtype.Date{Time: date, Valid: true},
			Provider:         entry.Provider,
			Model:            entry.Model,
			InputTokens:      entry.InputTokens,
			OutputTokens:     entry.OutputTokens,
			CacheReadTokens:  entry.CacheReadTokens,
			CacheWriteTokens: entry.CacheWriteTokens,
		})
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// GetRuntimeUsage returns usage data for a runtime (protected route).
func (h *Handler) GetRuntimeUsage(w http.ResponseWriter, r *http.Request) {
	runtimeID := chi.URLParam(r, "runtimeId")

	rt, err := h.Queries.GetAgentRuntime(r.Context(), parseUUID(runtimeID))
	if err != nil {
		writeError(w, http.StatusNotFound, "runtime not found")
		return
	}

	if _, ok := h.requireWorkspaceMember(w, r, uuidToString(rt.WorkspaceID), "runtime not found"); !ok {
		return
	}

	limit := int32(90)
	if l := r.URL.Query().Get("days"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 365 {
			limit = int32(parsed)
		}
	}

	rows, err := h.Queries.ListRuntimeUsage(r.Context(), db.ListRuntimeUsageParams{
		RuntimeID: parseUUID(runtimeID),
		Limit:     limit,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list usage")
		return
	}

	// If no runtime_usage records (e.g. for providers without CLI log scanning
	// like opencode, openclaw, hermes), fall back to aggregating from task_usage.
	if len(rows) == 0 {
		since := time.Now().AddDate(0, 0, -int(limit))
		slog.Info("GetRuntimeUsage fallback query", "workspace_id", rt.WorkspaceID, "provider", rt.Provider, "since", since)
		taskRows, err := h.Queries.GetRuntimeUsageByProvider(r.Context(), db.GetRuntimeUsageByProviderParams{
			WorkspaceID: rt.WorkspaceID,
			Provider:    rt.Provider,
			Column3:     pgtype.Timestamptz{Time: since, Valid: true},
		})
		slog.Info("GetRuntimeUsage fallback result", "task_rows", len(taskRows), "error", err)
		if err == nil && len(taskRows) > 0 {
			for _, row := range taskRows {
				rows = append(rows, db.RuntimeUsage{
					RuntimeID:        parseUUID(runtimeID),
					Date:             pgtype.Date{Time: row.Date.Time, Valid: true},
					Provider:         rt.Provider,
					Model:            row.Model,
					InputTokens:      row.TotalInputTokens,
					OutputTokens:     row.TotalOutputTokens,
					CacheReadTokens:  row.TotalCacheReadTokens,
					CacheWriteTokens: row.TotalCacheWriteTokens,
				})
			}
		}
	}

	resp := make([]RuntimeUsageResponse, len(rows))
	for i, row := range rows {
		resp[i] = RuntimeUsageResponse{
			RuntimeID:        runtimeID,
			Date:             row.Date.Time.Format("2006-01-02"),
			Provider:         row.Provider,
			Model:            row.Model,
			InputTokens:      row.InputTokens,
			OutputTokens:     row.OutputTokens,
			CacheReadTokens:  row.CacheReadTokens,
			CacheWriteTokens: row.CacheWriteTokens,
		}
	}

	writeJSON(w, http.StatusOK, resp)
}

// GetRuntimeTaskActivity returns hourly task activity distribution for a runtime.
func (h *Handler) GetRuntimeTaskActivity(w http.ResponseWriter, r *http.Request) {
	runtimeID := chi.URLParam(r, "runtimeId")

	rt, err := h.Queries.GetAgentRuntime(r.Context(), parseUUID(runtimeID))
	if err != nil {
		writeError(w, http.StatusNotFound, "runtime not found")
		return
	}

	if _, ok := h.requireWorkspaceMember(w, r, uuidToString(rt.WorkspaceID), "runtime not found"); !ok {
		return
	}

	rows, err := h.Queries.GetRuntimeTaskHourlyActivity(r.Context(), parseUUID(runtimeID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get task activity")
		return
	}

	type HourlyActivity struct {
		Hour  int `json:"hour"`
		Count int `json:"count"`
	}

	resp := make([]HourlyActivity, len(rows))
	for i, row := range rows {
		resp[i] = HourlyActivity{Hour: int(row.Hour), Count: int(row.Count)}
	}

	writeJSON(w, http.StatusOK, resp)
}

// GetWorkspaceUsageByDay returns daily token usage aggregated by model for the workspace.
func (h *Handler) GetWorkspaceUsageByDay(w http.ResponseWriter, r *http.Request) {
	workspaceID := resolveWorkspaceID(r)
	since := parseSinceParam(r, 30)

	rows, err := h.Queries.GetWorkspaceUsageByDay(r.Context(), db.GetWorkspaceUsageByDayParams{
		WorkspaceID: parseUUID(workspaceID),
		Since:       since,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get usage")
		return
	}

	type DailyUsageRow struct {
		Date                  string `json:"date"`
		Model                 string `json:"model"`
		TotalInputTokens      int64  `json:"total_input_tokens"`
		TotalOutputTokens     int64  `json:"total_output_tokens"`
		TotalCacheReadTokens  int64  `json:"total_cache_read_tokens"`
		TotalCacheWriteTokens int64  `json:"total_cache_write_tokens"`
		TaskCount             int32  `json:"task_count"`
	}

	resp := make([]DailyUsageRow, len(rows))
	for i, row := range rows {
		resp[i] = DailyUsageRow{
			Date:                  row.Date.Time.Format("2006-01-02"),
			Model:                 row.Model,
			TotalInputTokens:      row.TotalInputTokens,
			TotalOutputTokens:     row.TotalOutputTokens,
			TotalCacheReadTokens:  row.TotalCacheReadTokens,
			TotalCacheWriteTokens: row.TotalCacheWriteTokens,
			TaskCount:             row.TaskCount,
		}
	}

	writeJSON(w, http.StatusOK, resp)
}

// GetWorkspaceUsageSummary returns total token usage aggregated by model for the workspace.
func (h *Handler) GetWorkspaceUsageSummary(w http.ResponseWriter, r *http.Request) {
	workspaceID := resolveWorkspaceID(r)
	since := parseSinceParam(r, 30)

	rows, err := h.Queries.GetWorkspaceUsageSummary(r.Context(), db.GetWorkspaceUsageSummaryParams{
		WorkspaceID: parseUUID(workspaceID),
		Since:       since,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get usage summary")
		return
	}

	type UsageSummaryRow struct {
		Model                 string `json:"model"`
		TotalInputTokens      int64  `json:"total_input_tokens"`
		TotalOutputTokens     int64  `json:"total_output_tokens"`
		TotalCacheReadTokens  int64  `json:"total_cache_read_tokens"`
		TotalCacheWriteTokens int64  `json:"total_cache_write_tokens"`
		TaskCount             int32  `json:"task_count"`
	}

	resp := make([]UsageSummaryRow, len(rows))
	for i, row := range rows {
		resp[i] = UsageSummaryRow{
			Model:                 row.Model,
			TotalInputTokens:      row.TotalInputTokens,
			TotalOutputTokens:     row.TotalOutputTokens,
			TotalCacheReadTokens:  row.TotalCacheReadTokens,
			TotalCacheWriteTokens: row.TotalCacheWriteTokens,
			TaskCount:             row.TaskCount,
		}
	}

	writeJSON(w, http.StatusOK, resp)
}

// parseSinceParam parses the "days" query parameter and returns a timestamptz.
func parseSinceParam(r *http.Request, defaultDays int) pgtype.Timestamptz {
	days := defaultDays
	if d := r.URL.Query().Get("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 && parsed <= 365 {
			days = parsed
		}
	}
	t := time.Now().AddDate(0, 0, -days)
	return pgtype.Timestamptz{Time: t, Valid: true}
}

func (h *Handler) ListAgentRuntimes(w http.ResponseWriter, r *http.Request) {
	workspaceID := resolveWorkspaceID(r)

	var runtimes []db.AgentRuntime
	var err error

	if ownerFilter := r.URL.Query().Get("owner"); ownerFilter == "me" {
		userID, ok := requireUserID(w, r)
		if !ok {
			return
		}
		runtimes, err = h.Queries.ListAgentRuntimesByOwner(r.Context(), db.ListAgentRuntimesByOwnerParams{
			WorkspaceID: parseUUID(workspaceID),
			OwnerID:     parseUUID(userID),
		})
	} else {
		runtimes, err = h.Queries.ListAgentRuntimes(r.Context(), parseUUID(workspaceID))
	}

	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list runtimes")
		return
	}

	resp := make([]AgentRuntimeResponse, len(runtimes))
	for i, rt := range runtimes {
		resp[i] = runtimeToResponse(rt)
	}

	writeJSON(w, http.StatusOK, resp)
}

// DeleteAgentRuntime deletes a runtime after permission and dependency checks.
func (h *Handler) DeleteAgentRuntime(w http.ResponseWriter, r *http.Request) {
	runtimeID := chi.URLParam(r, "runtimeId")

	rt, err := h.Queries.GetAgentRuntime(r.Context(), parseUUID(runtimeID))
	if err != nil {
		writeError(w, http.StatusNotFound, "runtime not found")
		return
	}

	wsID := uuidToString(rt.WorkspaceID)
	member, ok := h.requireWorkspaceMember(w, r, wsID, "runtime not found")
	if !ok {
		return
	}

	// Permission: owner/admin can delete any runtime; members can only delete their own.
	userID := uuidToString(member.UserID)
	isAdmin := roleAllowed(member.Role, "owner", "admin")
	isOwner := rt.OwnerID.Valid && uuidToString(rt.OwnerID) == userID
	if !isAdmin && !isOwner {
		writeError(w, http.StatusForbidden, "you can only delete your own runtimes")
		return
	}

	// Check if any active (non-archived) agents are bound to this runtime.
	activeCount, err := h.Queries.CountActiveAgentsByRuntime(r.Context(), rt.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to check runtime dependencies")
		return
	}
	if activeCount > 0 {
		writeError(w, http.StatusConflict, "cannot delete runtime: it has active agents bound to it. Archive or reassign the agents first.")
		return
	}

	// Remove archived agents so the FK constraint (ON DELETE RESTRICT) won't block deletion.
	if err := h.Queries.DeleteArchivedAgentsByRuntime(r.Context(), rt.ID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to clean up archived agents")
		return
	}

	if err := h.Queries.DeleteAgentRuntime(r.Context(), rt.ID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete runtime")
		return
	}

	slog.Info("runtime deleted", "runtime_id", runtimeID, "deleted_by", userID)

	// Notify frontend to refresh runtime list.
	h.publish(protocol.EventDaemonRegister, wsID, "member", userID, map[string]any{
		"action": "delete",
	})

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// ModelInfo represents a single available model for an agent runtime.
type ModelInfo struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
}

// GetRuntimeModels returns available models for a runtime based on its provider.
func (h *Handler) GetRuntimeModels(w http.ResponseWriter, r *http.Request) {
	runtimeID := chi.URLParam(r, "runtimeId")

	rt, err := h.Queries.GetAgentRuntime(r.Context(), parseUUID(runtimeID))
	if err != nil {
		writeError(w, http.StatusNotFound, "runtime not found")
		return
	}

	if _, ok := h.requireWorkspaceMember(w, r, uuidToString(rt.WorkspaceID), "runtime not found"); !ok {
		return
	}

	models := getModelsForRuntime(rt.Provider, rt.RuntimeMode)

	writeJSON(w, http.StatusOK, map[string]any{"models": models})
}

// getModelsForRuntime returns available models based on provider and runtime mode.
// Priority: CLI (real-time) > API (cloud) > Preset (fallback)
func getModelsForRuntime(provider, runtimeMode string) []ModelInfo {
	// 1. First try to get models from CLI (real-time)
	if models := fetchModelsFromCLI(provider); models != nil && len(models) > 0 {
		return models
	}

	// 2. For cloud runtimes without CLI, try API models
	if runtimeMode == "cloud" {
		if models := fetchModelsFromAPI(provider); models != nil && len(models) > 0 {
			return models
		}
	}

	// 3. Fallback to preset models
	return getPresetModels(provider)
}

// fetchModelsFromAPI tries to get models from provider API for cloud runtimes.
func fetchModelsFromAPI(provider string) []ModelInfo {
	switch provider {
	case "opencode":
		return []ModelInfo{
			{ID: "claude-sonnet-4", Name: "Claude Sonnet 4", Description: "Via OpenCode API"},
			{ID: "gpt-4o", Name: "GPT-4o", Description: "Via OpenCode API"},
		}
	case "kimi":
		return []ModelInfo{
			{ID: "kimi-for-coding", Name: "Kimi for Coding", Description: "Moonshot - Coding optimized"},
			{ID: "kimi-k2-latest", Name: "Kimi K2", Description: "Moonshot - Latest model"},
		}
	}
	return nil
}

func getPresetModels(provider string) []ModelInfo {

	switch provider {
	case "opencode":
		return []ModelInfo{
			{ID: "claude-sonnet-4", Name: "Claude Sonnet 4", Description: "Via OpenCode"},
			{ID: "gpt-4o", Name: "GPT-4o", Description: "Via OpenCode"},
		}
	case "kimi":
		return []ModelInfo{
			{ID: "kimi-for-coding", Name: "Kimi for Coding", Description: "Optimized for coding tasks"},
			{ID: "kimi-k2", Name: "Kimi K2", Description: "General purpose model"},
		}
	case "hermes":
		return []ModelInfo{{ID: "default", Name: "Default", Description: "Hermes default model"}}
	case "openclaw":
		return []ModelInfo{{ID: "default", Name: "Default", Description: "OpenClaw default model"}}
	default:
		return []ModelInfo{{ID: "default", Name: "Default", Description: "Default model for " + provider}}
	}
}

// fetchModelsFromCLI attempts to get available models from the CLI tool.
// Returns nil if CLI is not available or command fails.
func fetchModelsFromCLI(provider string) []ModelInfo {
	var execPath string

	switch provider {
	case "opencode":
		execPath = "opencode"
	case "kimi":
		execPath = "kimi"
	default:
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	models, err := listModelsFromCLI(ctx, execPath, provider)
	if err != nil {
		slog.Debug("failed to get models from CLI", "provider", provider, "error", err)
		return nil
	}

	return models
}

// listModelsFromCLI executes the CLI and tries to parse available models.
func listModelsFromCLI(ctx context.Context, execPath, provider string) ([]ModelInfo, error) {
	cmd := exec.CommandContext(ctx, execPath, "--version")
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("CLI not available: %w", err)
	}

	switch provider {
	case "opencode":
		return fetchOpenCodeModels(ctx, execPath)
	case "kimi":
		return fetchKimiModels(ctx, execPath)
	}
	return nil, nil
}

func fetchOpenCodeModels(ctx context.Context, execPath string) ([]ModelInfo, error) {
	cmd := exec.CommandContext(ctx, execPath, "models")
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to run opencode models: %w", err)
	}

	var models []ModelInfo
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		// Parse model names like "opencode/claude-sonnet-4" or "volcengine-plan/kimi-k2.5"
		modelName := strings.TrimPrefix(line, "opencode/")
		modelName = strings.TrimPrefix(modelName, "opencode-go/")
		modelName = strings.TrimPrefix(modelName, "volcengine-plan/")

		// Format model name for display
		displayName := formatModelName(modelName)

		models = append(models, ModelInfo{
			ID:          line,
			Name:        displayName,
			Description: line,
		})
	}

	if len(models) == 0 {
		return nil, fmt.Errorf("no models found in output")
	}
	return models, nil
}

func formatModelName(name string) string {
	// Convert "claude-sonnet-4" to "Claude Sonnet 4"
	name = strings.ReplaceAll(name, "-", " ")
	words := strings.Fields(name)
	for i, word := range words {
		if i == 0 {
			word = strings.ToUpper(word[:1]) + word[1:]
		}
		words[i] = word
	}
	return strings.Join(words, " ")
}

func fetchKimiModels(ctx context.Context, execPath string) ([]ModelInfo, error) {
	// Kimi CLI doesn't have "models" command, but it auto-refreshes models from API
	// Use known Kimi models from Moonshot
	return []ModelInfo{
		{ID: "kimi-k2.6", Name: "Kimi K2.6", Description: "Moonshot - Latest K2 series"},
		{ID: "kimi-k2.5", Name: "Kimi K2.5", Description: "Moonshot - Previous K2"},
		{ID: "kimi-k2.5-code-preview", Name: "Kimi K2.5 Code Preview", Description: "Moonshot - Code optimized"},
		{ID: "kimi-for-coding", Name: "Kimi for Coding", Description: "Moonshot - Coding optimized"},
		{ID: "moonshot-v1-8k", Name: "Moonshot v1 8K", Description: "Moonshot - Legacy model"},
	}, nil
}

// UpdateAgentRuntime updates runtime metadata (e.g., API key).
func (h *Handler) UpdateAgentRuntime(w http.ResponseWriter, r *http.Request) {
	runtimeID := chi.URLParam(r, "runtimeId")
	workspaceID := resolveWorkspaceID(r)

	if _, ok := h.workspaceMember(w, r, workspaceID); !ok {
		return
	}

	var req struct {
		Metadata map[string]any `json:"metadata"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Metadata == nil {
		writeError(w, http.StatusBadRequest, "metadata is required")
		return
	}

	metadataJSON, err := json.Marshal(req.Metadata)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to marshal metadata")
		return
	}

	rt, err := h.Queries.UpdateAgentRuntimeMetadata(r.Context(), db.UpdateAgentRuntimeMetadataParams{
		ID:          parseUUID(runtimeID),
		Metadata:    metadataJSON,
		WorkspaceID: parseUUID(workspaceID),
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update runtime: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, runtimeToResponse(rt))
}
