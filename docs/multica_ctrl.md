# agentharness ctrl - 多用户 CLI 实例管理

## 概述

`agentharness ctrl` 命令用于在同一台机器上启动和管理多个用户的独立 CLI 实例。每个实例运行在独立进程中，包含**自动登录认证**功能。

## 工作流程

```
agentharness ctrl start --user alice --workspace ws-001
    │
    ▼ 检查 ~/.agentharness/profiles/alice/config.json
    │
    ├─ [已认证] Token 有效 → 直接启动 daemon
    │
    └─ [未认证/过期] → 浏览器验证码 → 获取 PAT → 保存 Token → 启动 daemon
    │
    ▼
agentharness daemon start (每个用户独立进程轮询 task)
```

## 新增命令

### ctrl

多用户实例管理主命令。

```bash
agentharness ctrl [command]
```

### ctrl start

启动一个 CLI 实例给指定用户，包含自动登录。

```bash
agentharness ctrl start --user <user> --workspace <workspace-id> [flags]
```

**必填参数：**

- `--user`: 用户标识符
- `--workspace`: 工作区 ID

**可选参数：**

- `--profile`: 配置 profile 名称（默认: 等于 user）
- `--server-url`: Server URL（默认: `http://localhost:8080`）
- `--app-url`: App URL 用于登录（默认: `http://localhost:3000`）
- `--env`: 环境变量，格式 `--env KEY=VALUE`

**示例：**

```bash
# 为 alice 启动实例（自动打开浏览器登录）
agentharness ctrl start --user alice --workspace ws-001

# 为 bob 启动实例
agentharness ctrl start --user bob --workspace ws-002 --server-url http://8080.agentharness.internal

# 停止后重新启动（token 有效则跳过登录）
agentharness ctrl start --user alice --workspace ws-001
```

### ctrl stop

停止一个 CLI 实例。

```bash
agentharness ctrl stop [flags]
```

**参数：**

- `--user`: 要停止的用户名（可选）
- `--instance-id`: 要停止的实例 ID（可选）

**示例：**

```bash
# 停止 alice 的所有实例
agentharness ctrl stop --user alice

# 按实例 ID 停止
agentharness ctrl stop --instance-id <uuid>
```

### ctrl list

列出所有运行中的实例。

```bash
agentharness ctrl list
```

**输出示例：**

```
USER       WORKSPACE  PROFILE    PID      STATUS
--------------------------------------------------
alice      ws-001     alice      12345    running
bob        ws-002     bob        12346    running
```

## 实现原理

### 架构

```
┌─────────────────────────────────────┐
│      agentharness ctrl (主进程)           │
├─────────────────────────────────────┤
│  InstanceManager                   │
│  - 管理 instances map               │
│  - 状态持久化到 ~/.agentharness/         │
│  - 自动登录认证                     │
│  - 多进程启动/停止                  │
└─────────────────────────────────────┘
        │
        ├─ [未认证] → 浏览器登录 → 获取 PAT → 保存到 profile config
        │
        ▼
┌─────────────────────────────────────┐
│  agentharness --profile alice daemon start │ ───► Alice's Daemon
│  agentharness --profile bob daemon start │ ───► Bob's Daemon
└─────────────────────────────────────┘
```

### 自动登录流程

1. **检查现有 Token**
   - 读取 `~/.agentharness/profiles/<user>/config.json`
   - 调用 `/api/me` 验证 Token 有效性

2. **有效期** → 直接启动 daemon

3. **过期/无 Token** → 启动浏览器登录
   - 启动本地 HTTP server (`127.0.0.1:0`)
   - 生成 state 参数防止 CSRF
   - 打开浏览器跳转到 `{appURL}/login?cli_callback=...&cli_state=...`
   - 等待回调携带 JWT
   - 用 JWT 换取 PAT (`/api/tokens`)
   - 验证 PAT 后保存到 profile 配置

4. **启动 Daemon**
   - 使用子进程运行 `agentharness --profile <user> daemon start`
   - Setsid + Setpgid 创建新会话隔离

### 核心组件

1. **InstanceManager**: 管理所有实例状态
   - `instances` map: 存储实例信息
   - `saveState()` / `loadState()`: 持久化到 JSON 文件
   - `ensureAuthenticated()`: 自动登录认证
   - `doBrowserLogin()`: 浏览器验证码流程

2. **Instance** 结构体:
   ```go
   type Instance struct {
       ID         string            // 唯一标识 UUID
       User       string            // 用户名
       Workspace  string            // 工作区 ID
       PID        int               // 进程 ID
       Profile    string            // profile 名称
       Status     string            // running/stopped
       StartedAt  time.Time         // 启动时间
       Env        map[string]string // 环境变量
   }
   ```

3. **进程隔离**:
   - 每个实例通过 `exec.Command` 启动为独立进程
   - 使用 `Setsid` + `Setpgid` 创建新会话
   - 通过 `os.FindProcess()` + `SIGTERM` 停止

### 配置文件隔离

每个用户的配置独立存储：

| User | Config Path |
|------|-------------|
| alice | `~/.agentharness/profiles/alice/config.json` |
| bob | `~/.agentharness/profiles/bob/config.json` |

配置内容：
```json
{
  "server_url": "http://localhost:8080",
  "app_url": "http://localhost:3000",
  "workspace_id": "ws-001",
  "token": "mul_xxx",
  "watched_workspaces": [...]
}
```

### 状态存储

实例状态文件：`~/.agentharness/instances/instances.json`

```json
{
  "<uuid>": {
    "id": "<uuid>",
    "user": "alice",
    "workspace": "ws-001",
    "pid": 12345,
    "profile": "alice",
    "status": "running",
    "started_at": "2026-04-14T10:00:00Z",
    "env": {}
  }
}
```

## 与原有命令的关系

| 原命令 | 作用 | ctrl 中的角色 |
|--------|------|---------------|
| `agentharness login` | 验证码认证 + 配置 workspace | **自动调用** |
| `agentharness daemon start` | 启动 daemon 轮询任务 | **自动启动** |

**完整流程对比：**

| 手动操作 | ctrl 自动 |
|----------|-----------|
| `agentharness login` | ✅ 自动完成 |
| `agentharness workspace watch ws-001` | 需手动配置 |
| `agentharness daemon start` | ✅ 自动启动 |

## 使用流程

### 1. 系统管理员操作

```bash
# 为多个用户启动实例
agentharness ctrl start --user alice --workspace ws-001
agentharness ctrl start --user bob --workspace ws-002
agentharness ctrl start --user charlie --workspace ws-003

# 查看运行状态
agentharness ctrl list

# 停止某个用户
agentharness ctrl stop --user bob
```

### 2. 用户后续操作

用户也可以自行运行：

```bash
# 用户自行启动
agentharness login          # 首次认证
agentharness workspace watch ws-001  # 监workspace
agentharness daemon start   # 启动 daemon
```

## 文件变更

- 新增: `server/cmd/agentharness/cmd_ctrl.go`
  - InstanceManager 管理类
  - Instance 实例结构体
  - 自动登录认证逻辑
  - ctrl/ctrlStart/ctrlStop/ctrlList 命令