-- name: ListWorkspaceAPIKeys :many
SELECT * FROM api_key WHERE workspace_id = $1 AND agent_id IS NULL ORDER BY key_name;

-- name: ListAgentAPIKeys :many
SELECT * FROM api_key WHERE workspace_id = $1 AND agent_id = $2 ORDER BY key_name;

-- name: UpsertWorkspaceAPIKey :one
INSERT INTO api_key (workspace_id, key_name, encrypted_value, created_by)
VALUES ($1, $2, $3, $4)
ON CONFLICT (workspace_id, key_name) WHERE agent_id IS NULL
DO UPDATE SET encrypted_value = $3, updated_at = now()
RETURNING *;

-- name: UpsertAgentAPIKey :one
INSERT INTO api_key (workspace_id, agent_id, key_name, encrypted_value, created_by)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (workspace_id, agent_id, key_name) WHERE agent_id IS NOT NULL
DO UPDATE SET encrypted_value = $4, updated_at = now()
RETURNING *;

-- name: DeleteWorkspaceAPIKey :exec
DELETE FROM api_key WHERE workspace_id = $1 AND key_name = $2 AND agent_id IS NULL;

-- name: DeleteAgentAPIKey :exec
DELETE FROM api_key WHERE workspace_id = $1 AND key_name = $2 AND agent_id = $3;

-- name: DeleteAllWorkspaceAPIKeys :exec
DELETE FROM api_key WHERE workspace_id = $1 AND agent_id IS NULL;

-- name: DeleteAllAgentAPIKeys :exec
DELETE FROM api_key WHERE workspace_id = $1 AND agent_id = $2;

-- name: GetEffectiveAPIKeys :many
SELECT key_name, encrypted_value FROM api_key
WHERE workspace_id = $1 AND (agent_id = $2 OR agent_id IS NULL)
ORDER BY agent_id NULLS LAST;
