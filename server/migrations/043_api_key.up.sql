CREATE TABLE api_key (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id     UUID NOT NULL REFERENCES workspace(id),
    agent_id         UUID REFERENCES agent(id),
    key_name         TEXT NOT NULL,
    encrypted_value  TEXT NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by       UUID REFERENCES member(id)
);

CREATE UNIQUE INDEX idx_api_key_workspace_key ON api_key (workspace_id, key_name) WHERE agent_id IS NULL;
CREATE UNIQUE INDEX idx_api_key_agent_key ON api_key (workspace_id, agent_id, key_name) WHERE agent_id IS NOT NULL;
