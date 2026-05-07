import type { StorageAdapter } from "../types/storage";

/**
 * Keys that are namespaced per workspace (stored as `${key}:${wsId}`).
 *
 * IMPORTANT: When adding a new workspace-scoped persist store or storage key,
 * add its key here so that workspace deletion and logout properly clean it up.
 * Also ensure the store uses `createWorkspaceAwareStorage` for its persist config.
 */
const WORKSPACE_SCOPED_KEYS = [
  "agentharness_issue_draft",
  "agentharness_issues_view",
  "agentharness_issues_scope",
  "agentharness_my_issues_view",
  "agentharness:chat:selectedAgentId",
  "agentharness:chat:activeSessionId",
];

/** Remove all workspace-scoped storage entries for the given workspace. */
export function clearWorkspaceStorage(
  adapter: StorageAdapter,
  wsId: string,
) {
  for (const key of WORKSPACE_SCOPED_KEYS) {
    adapter.removeItem(`${key}:${wsId}`);
  }
}
