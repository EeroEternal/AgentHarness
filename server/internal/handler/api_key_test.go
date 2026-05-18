package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

const testEncryptionKey = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"

// getMemberID resolves the member ID for a user in a workspace.
func getMemberID(t *testing.T, ctx context.Context, pool *pgxpool.Pool, workspaceID, userID string) string {
	t.Helper()
	var memberID string
	if err := pool.QueryRow(ctx,
		`SELECT id FROM member WHERE workspace_id = $1 AND user_id = $2`,
		workspaceID, userID,
	).Scan(&memberID); err != nil {
		t.Fatalf("get member id: %v", err)
	}
	return memberID
}

// newWorkspaceAPIKeyRequest builds an authenticated request for workspace-scoped
// API key endpoints. It sets X-User-ID to the member ID (required by created_by FK).
func newWorkspaceKeyRequest(t *testing.T, ctx context.Context, method, workspaceID string, body any) *http.Request {
	t.Helper()
	memberID := getMemberID(t, ctx, testPool, workspaceID, testUserID)
	req := newRequest(method, "/api/workspaces/"+workspaceID+"/api-keys", body)
	req.Header.Set("X-User-ID", memberID)
	return req
}

// newAgentKeyRequest builds an authenticated request for agent-scoped API key
// endpoints. It sets X-User-ID to the member ID.
func newAgentKeyRequest(t *testing.T, ctx context.Context, method, agentID string, body any) *http.Request {
	t.Helper()
	req := newRequest(method, "/api/agents/"+agentID+"/api-keys", body)
	// Resolve member ID from the fixture workspace.
	memberID := getMemberID(t, ctx, testPool, testWorkspaceID, testUserID)
	req.Header.Set("X-User-ID", memberID)
	return req
}

// createOtherWorkspace creates a second workspace with the test user as a member,
// and returns the workspace ID, runtime ID, and agent ID.
func createOtherWorkspace(t *testing.T, ctx context.Context, pool *pgxpool.Pool, userID string) (workspaceID, runtimeID, agentID string) {
	t.Helper()

	if err := pool.QueryRow(ctx, `
		INSERT INTO workspace (name, slug, description, issue_prefix)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, "Other Workspace", "other-workspace-api-key-test", "Temporary for API key isolation test", "OTH").Scan(&workspaceID); err != nil {
		t.Fatalf("create other workspace: %v", err)
	}

	if _, err := pool.Exec(ctx, `
		INSERT INTO member (workspace_id, user_id, role)
		VALUES ($1, $2, 'owner')
	`, workspaceID, userID); err != nil {
		t.Fatalf("create other member: %v", err)
	}

	if err := pool.QueryRow(ctx, `
		INSERT INTO agent_runtime (workspace_id, daemon_id, name, runtime_mode, provider, status, device_info, metadata, last_seen_at, health_port)
		VALUES ($1, NULL, $2, 'cloud', $3, 'online', $4, '{}'::jsonb, now(), 0)
		RETURNING id
	`, workspaceID, "Other Runtime", "claude", "Other runtime").Scan(&runtimeID); err != nil {
		t.Fatalf("create other runtime: %v", err)
	}

	if err := pool.QueryRow(ctx, `
		INSERT INTO agent (workspace_id, name, description, runtime_mode, runtime_config, runtime_id, visibility, max_concurrent_tasks, owner_id)
		VALUES ($1, $2, '', 'cloud', '{}'::jsonb, $3, 'workspace', 1, $4)
		RETURNING id
	`, workspaceID, "Other Agent", runtimeID, userID).Scan(&agentID); err != nil {
		t.Fatalf("create other agent: %v", err)
	}

	return
}

func TestWorkspaceAPIKeyIsolation(t *testing.T) {
	ctx := context.Background()

	// Create a second workspace with its own runtime and agent.
	otherWsID, _, _ := createOtherWorkspace(t, ctx, testPool, testUserID)
	t.Cleanup(func() {
		testPool.Exec(ctx, `DELETE FROM agent WHERE workspace_id = $1`, otherWsID)
		testPool.Exec(ctx, `DELETE FROM agent_runtime WHERE workspace_id = $1`, otherWsID)
		testPool.Exec(ctx, `DELETE FROM member WHERE workspace_id = $1`, otherWsID)
		testPool.Exec(ctx, `DELETE FROM workspace WHERE id = $1`, otherWsID)
	})

	// ── 1. Add API keys to fixture workspace (A) ──
	w := httptest.NewRecorder()
	req := newWorkspaceKeyRequest(t, ctx, "PUT", testWorkspaceID, map[string]any{
		"keys": map[string]string{
			"ANTHROPIC_API_KEY": "sk-ant-test-workspace-a",
			"OPENAI_API_KEY":    "sk-openai-test-workspace-a",
		},
	})
	req.Header.Set("X-Encryption-Key", testEncryptionKey)
	req = withURLParam(req, "id", testWorkspaceID)
	testHandler.PutWorkspaceAPIKeys(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("PutWorkspaceAPIKeys(A): expected 200, got %d: %s", w.Code, w.Body.String())
	}
	t.Cleanup(func() {
		testPool.Exec(ctx, `DELETE FROM api_key WHERE workspace_id = $1`, parseUUID(testWorkspaceID))
	})

	// ── 2. List workspace A keys from workspace A — should see 2 keys ──
	w = httptest.NewRecorder()
	req = newRequest("GET", "/api/workspaces/"+testWorkspaceID+"/api-keys", nil)
	req = withURLParam(req, "id", testWorkspaceID)
	testHandler.ListWorkspaceAPIKeys(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("ListWorkspaceAPIKeys(A): expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var keysA []APIKeyResponse
	json.NewDecoder(w.Body).Decode(&keysA)
	if len(keysA) != 2 {
		t.Fatalf("workspace A: expected 2 keys, got %d", len(keysA))
	}

	// ── 3. List workspace B keys from workspace B — should see 0 keys ──
	w = httptest.NewRecorder()
	req = newRequest("GET", "/api/workspaces/"+otherWsID+"/api-keys", nil)
	req = withURLParam(req, "id", otherWsID)
	testHandler.ListWorkspaceAPIKeys(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("ListWorkspaceAPIKeys(B): expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var keysB []APIKeyResponse
	json.NewDecoder(w.Body).Decode(&keysB)
	if len(keysB) != 0 {
		t.Fatalf("workspace B: expected 0 keys, got %d (cross-workspace leak!)", len(keysB))
	}
}

func TestGetEffectiveAPIKeysIsolation(t *testing.T) {
	ctx := context.Background()

	// Create a second workspace with its own runtime and agent.
	otherWsID, _, otherAgentID := createOtherWorkspace(t, ctx, testPool, testUserID)
	t.Cleanup(func() {
		testPool.Exec(ctx, `DELETE FROM agent WHERE workspace_id = $1`, otherWsID)
		testPool.Exec(ctx, `DELETE FROM agent_runtime WHERE workspace_id = $1`, otherWsID)
		testPool.Exec(ctx, `DELETE FROM member WHERE workspace_id = $1`, otherWsID)
		testPool.Exec(ctx, `DELETE FROM workspace WHERE id = $1`, otherWsID)
	})

	// ── 1. Add API keys to workspace A ──
	w := httptest.NewRecorder()
	req := newWorkspaceKeyRequest(t, ctx, "PUT", testWorkspaceID, map[string]any{
		"keys": map[string]string{
			"ANTHROPIC_API_KEY": "sk-ant-secret",
		},
	})
	req.Header.Set("X-Encryption-Key", testEncryptionKey)
	req = withURLParam(req, "id", testWorkspaceID)
	testHandler.PutWorkspaceAPIKeys(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("PutWorkspaceAPIKeys: expected 200, got %d: %s", w.Code, w.Body.String())
	}
	t.Cleanup(func() {
		testPool.Exec(ctx, `DELETE FROM api_key WHERE workspace_id = $1`, parseUUID(testWorkspaceID))
	})

	// ── 2. Get fixture agent ID ──
	var fixtureAgentID string
	if err := testPool.QueryRow(ctx,
		`SELECT id FROM agent WHERE workspace_id = $1 AND name = $2`,
		testWorkspaceID, "Handler Test Agent",
	).Scan(&fixtureAgentID); err != nil {
		t.Fatalf("find fixture agent: %v", err)
	}

	// ── 3. Effective keys for fixture agent (workspace A) — should see 1 key ──
	w = httptest.NewRecorder()
	req = newRequest("GET", "/api/daemon/agents/"+fixtureAgentID+"/effective-api-keys", nil)
	req = withURLParam(req, "id", fixtureAgentID)
	req.Header.Set("X-Encryption-Key", testEncryptionKey)
	testHandler.GetEffectiveAPIKeys(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("GetEffectiveAPIKeys(A): expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var effectiveA map[string]string
	json.NewDecoder(w.Body).Decode(&effectiveA)
	if len(effectiveA) != 1 {
		t.Fatalf("fixture agent: expected 1 effective key, got %d", len(effectiveA))
	}
	if effectiveA["ANTHROPIC_API_KEY"] != "sk-ant-secret" {
		t.Fatalf("fixture agent: expected decrypted value 'sk-ant-secret', got '%s'", effectiveA["ANTHROPIC_API_KEY"])
	}

	// ── 4. Effective keys for agent in workspace B — should see 0 keys ──
	w = httptest.NewRecorder()
	req = newRequest("GET", "/api/daemon/agents/"+otherAgentID+"/effective-api-keys", nil)
	req = withURLParam(req, "id", otherAgentID)
	req.Header.Set("X-Encryption-Key", testEncryptionKey)
	testHandler.GetEffectiveAPIKeys(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("GetEffectiveAPIKeys(B): expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var effectiveB map[string]string
	json.NewDecoder(w.Body).Decode(&effectiveB)
	if len(effectiveB) != 0 {
		t.Fatalf("other workspace agent: expected 0 effective keys, got %d (cross-workspace leak!)", len(effectiveB))
	}
}

func TestAgentAPIKeyIsolation(t *testing.T) {
	ctx := context.Background()

	// Create a second workspace with its own runtime and agent.
	otherWsID, _, otherAgentID := createOtherWorkspace(t, ctx, testPool, testUserID)
	t.Cleanup(func() {
		testPool.Exec(ctx, `DELETE FROM agent WHERE workspace_id = $1`, otherWsID)
		testPool.Exec(ctx, `DELETE FROM agent_runtime WHERE workspace_id = $1`, otherWsID)
		testPool.Exec(ctx, `DELETE FROM member WHERE workspace_id = $1`, otherWsID)
		testPool.Exec(ctx, `DELETE FROM workspace WHERE id = $1`, otherWsID)
	})

	var fixtureAgentID string
	if err := testPool.QueryRow(ctx,
		`SELECT id FROM agent WHERE workspace_id = $1 AND name = $2`,
		testWorkspaceID, "Handler Test Agent",
	).Scan(&fixtureAgentID); err != nil {
		t.Fatalf("find fixture agent: %v", err)
	}

	// ── 1. Put agent-level keys for fixture agent ──
	w := httptest.NewRecorder()
	req := newAgentKeyRequest(t, ctx, "PUT", fixtureAgentID, map[string]any{
		"keys": map[string]string{
			"AGENT_SPECIFIC_KEY": "sk-agent-only",
		},
	})
	req = withURLParam(req, "id", fixtureAgentID)
	req.Header.Set("X-Encryption-Key", testEncryptionKey)
	testHandler.PutAgentAPIKeys(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("PutAgentAPIKeys: expected 200, got %d: %s", w.Code, w.Body.String())
	}
	t.Cleanup(func() {
		testPool.Exec(ctx, `DELETE FROM api_key WHERE workspace_id = $1`, parseUUID(testWorkspaceID))
	})

	// ── 2. List agent keys for other workspace's agent — should see 0 ──
	w = httptest.NewRecorder()
	req = newRequest("GET", "/api/agents/"+otherAgentID+"/api-keys", nil)
	req.Header.Set("X-Workspace-ID", otherWsID)
	req = withURLParam(req, "id", otherAgentID)
	testHandler.ListAgentAPIKeys(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("ListAgentAPIKeys(B): expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var keysOther []APIKeyResponse
	json.NewDecoder(w.Body).Decode(&keysOther)
	if len(keysOther) != 0 {
		t.Fatalf("other agent: expected 0 keys, got %d (cross-workspace leak!)", len(keysOther))
	}

	// ── 3. List agent keys for fixture agent — should see 1 ──
	w = httptest.NewRecorder()
	req = newRequest("GET", "/api/agents/"+fixtureAgentID+"/api-keys", nil)
	req = withURLParam(req, "id", fixtureAgentID)
	testHandler.ListAgentAPIKeys(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("ListAgentAPIKeys(A): expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var keysFixture []APIKeyResponse
	json.NewDecoder(w.Body).Decode(&keysFixture)
	if len(keysFixture) != 1 {
		t.Fatalf("fixture agent: expected 1 key, got %d", len(keysFixture))
	}
}
