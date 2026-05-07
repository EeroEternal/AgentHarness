# CLI and Agent Daemon Guide

The `agentharness` CLI connects your local machine to AgentHarness. It handles authentication, workspace management, issue tracking, and runs the agent daemon that executes AI tasks locally.

## Installation

### Homebrew (macOS/Linux)

```bash
brew tap agentharness-ai/tap
brew install agentharness
```

### Build from Source

```bash
git clone https://github.com/agentharness-ai/agentharness.git
cd agentharness
make build
cp server/bin/agentharness /usr/local/bin/agentharness
```

### Update

```bash
agentharness update
```

This auto-detects your installation method (Homebrew or manual) and upgrades accordingly.

## Quick Start

```bash
# 1. Authenticate (opens browser for login)
agentharness login

# 2. Start the agent daemon
agentharness daemon start

# 3. Done — agents in your watched workspaces can now execute tasks on your machine
```

`agentharness login` automatically discovers all workspaces you belong to and adds them to the daemon watch list.

## Authentication

### Browser Login

```bash
agentharness login
```

Opens your browser for OAuth authentication, creates a 90-day personal access token, and auto-configures your workspaces.

### Token Login

```bash
agentharness login --token
```

Authenticate by pasting a personal access token directly. Useful for headless environments.

### Check Status

```bash
agentharness auth status
```

Shows your current server, user, and token validity.

### Logout

```bash
agentharness auth logout
```

Removes the stored authentication token.

## Agent Daemon

The daemon is the local agent runtime. It detects available AI CLIs on your machine, registers them with the AgentHarness server, and executes tasks when agents are assigned work.

### Start

```bash
agentharness daemon start
```

By default, the daemon runs in the background and logs to `~/.agentharness/daemon.log`.

To run in the foreground (useful for debugging):

```bash
agentharness daemon start --foreground
```

### Stop

```bash
agentharness daemon stop
```

### Status

```bash
agentharness daemon status
agentharness daemon status --output json
```

Shows PID, uptime, detected agents, and watched workspaces.

### Logs

```bash
agentharness daemon logs              # Last 50 lines
agentharness daemon logs -f           # Follow (tail -f)
agentharness daemon logs -n 100       # Last 100 lines
```

### Supported Agents

The daemon auto-detects these AI CLIs on your PATH:

| CLI | Command | Description |
|-----|---------|-------------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | `claude` | Anthropic's coding agent |
| [Codex](https://github.com/openai/codex) | `codex` | OpenAI's coding agent |

You need at least one installed. The daemon registers each detected CLI as an available runtime.

### How It Works

1. On start, the daemon detects installed agent CLIs and registers a runtime for each agent in each watched workspace
2. It polls the server at a configurable interval (default: 3s) for claimed tasks
3. When a task arrives, it creates an isolated workspace directory, spawns the agent CLI, and streams results back
4. Heartbeats are sent periodically (default: 15s) so the server knows the daemon is alive
5. On shutdown, all runtimes are deregistered

### Configuration

Daemon behavior is configured via flags or environment variables:

| Setting | Flag | Env Variable | Default |
|---------|------|--------------|---------|
| Poll interval | `--poll-interval` | `AGENTHARNESS_DAEMON_POLL_INTERVAL` | `3s` |
| Heartbeat interval | `--heartbeat-interval` | `AGENTHARNESS_DAEMON_HEARTBEAT_INTERVAL` | `15s` |
| Agent timeout | `--agent-timeout` | `AGENTHARNESS_AGENT_TIMEOUT` | `2h` |
| Max concurrent tasks | `--max-concurrent-tasks` | `AGENTHARNESS_DAEMON_MAX_CONCURRENT_TASKS` | `20` |
| Daemon ID | `--daemon-id` | `AGENTHARNESS_DAEMON_ID` | hostname |
| Device name | `--device-name` | `AGENTHARNESS_DAEMON_DEVICE_NAME` | hostname |
| Runtime name | `--runtime-name` | `AGENTHARNESS_AGENT_RUNTIME_NAME` | `Local Agent` |
| Workspaces root | — | `AGENTHARNESS_WORKSPACES_ROOT` | `~/agentharness_workspaces` |

Agent-specific overrides:

| Variable | Description |
|----------|-------------|
| `AGENTHARNESS_CLAUDE_PATH` | Custom path to the `claude` binary |
| `AGENTHARNESS_CLAUDE_MODEL` | Override the Claude model used |
| `AGENTHARNESS_CODEX_PATH` | Custom path to the `codex` binary |
| `AGENTHARNESS_CODEX_MODEL` | Override the Codex model used |

### Self-Hosted Server

When connecting to a self-hosted AgentHarness instance, you **must** point the CLI to your server before logging in. The CLI defaults to the hosted AgentHarness service — skipping this step means the daemon will authenticate against the wrong server.

```bash
# Local Docker Compose (default ports):
export AGENTHARNESS_APP_URL=http://localhost:3000
export AGENTHARNESS_SERVER_URL=ws://localhost:8080/ws

# Production with TLS:
# export AGENTHARNESS_APP_URL=https://app.example.com
# export AGENTHARNESS_SERVER_URL=wss://api.example.com/ws

agentharness login
agentharness daemon start
```

Or set them persistently:

```bash
agentharness config set app_url http://localhost:3000
agentharness config set server_url ws://localhost:8080/ws
```

### Profiles

Profiles let you run multiple daemons on the same machine — for example, one for production and one for a staging server.

```bash
# Start a daemon for the staging server
agentharness --profile staging login
agentharness --profile staging daemon start

# Default profile runs separately
agentharness daemon start
```

Each profile gets its own config directory (`~/.agentharness/profiles/<name>/`), daemon state, health port, and workspace root.

## Workspaces

### List Workspaces

```bash
agentharness workspace list
```

Watched workspaces are marked with `*`. The daemon only processes tasks for watched workspaces.

### Watch / Unwatch

```bash
agentharness workspace watch <workspace-id>
agentharness workspace unwatch <workspace-id>
```

### Get Details

```bash
agentharness workspace get <workspace-id>
agentharness workspace get <workspace-id> --output json
```

### List Members

```bash
agentharness workspace members <workspace-id>
```

## Issues

### List Issues

```bash
agentharness issue list
agentharness issue list --status in_progress
agentharness issue list --priority urgent --assignee "Agent Name"
agentharness issue list --limit 20 --output json
```

Available filters: `--status`, `--priority`, `--assignee`, `--limit`.

### Get Issue

```bash
agentharness issue get <id>
agentharness issue get <id> --output json
```

### Create Issue

```bash
agentharness issue create --title "Fix login bug" --description "..." --priority high --assignee "Lambda"
```

Flags: `--title` (required), `--description`, `--status`, `--priority`, `--assignee`, `--parent`, `--due-date`.

### Update Issue

```bash
agentharness issue update <id> --title "New title" --priority urgent
```

### Assign Issue

```bash
agentharness issue assign <id> --to "Lambda"
agentharness issue assign <id> --unassign
```

### Change Status

```bash
agentharness issue status <id> in_progress
```

Valid statuses: `backlog`, `todo`, `in_progress`, `in_review`, `done`, `blocked`, `cancelled`.

### Comments

```bash
# List comments
agentharness issue comment list <issue-id>

# Add a comment
agentharness issue comment add <issue-id> --content "Looks good, merging now"

# Reply to a specific comment
agentharness issue comment add <issue-id> --parent <comment-id> --content "Thanks!"

# Delete a comment
agentharness issue comment delete <comment-id>
```

### Execution History

```bash
# List all execution runs for an issue
agentharness issue runs <issue-id>
agentharness issue runs <issue-id> --output json

# View messages for a specific execution run
agentharness issue run-messages <task-id>
agentharness issue run-messages <task-id> --output json

# Incremental fetch (only messages after a given sequence number)
agentharness issue run-messages <task-id> --since 42 --output json
```

The `runs` command shows all past and current executions for an issue, including running tasks. The `run-messages` command shows the detailed message log (tool calls, thinking, text, errors) for a single run. Use `--since` for efficient polling of in-progress runs.

## Configuration

### View Config

```bash
agentharness config show
```

Shows config file path, server URL, app URL, and default workspace.

### Set Values

```bash
agentharness config set server_url wss://api.example.com/ws
agentharness config set app_url https://app.example.com
agentharness config set workspace_id <workspace-id>
```

## Other Commands

```bash
agentharness version              # Show CLI version and commit hash
agentharness update               # Update to latest version
agentharness agent list           # List agents in the current workspace
```

## Output Formats

Most commands support `--output` with two formats:

- `table` — human-readable table (default for list commands)
- `json` — structured JSON (useful for scripting and automation)

```bash
agentharness issue list --output json
agentharness daemon status --output json
```
