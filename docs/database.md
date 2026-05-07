# 数据库表结构分析

本文档详细说明了 AgentHarness 项目中所有数据表的含义及字段定义。

## 核心表

### 1. user - 用户表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | TEXT | 用户名 |
| email | TEXT | 邮箱（唯一） |
| avatar_url | TEXT | 头像URL |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### 2. workspace - 工作空间

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | TEXT | 工作空间名称 |
| slug | TEXT | URL友好标识（唯一） |
| description | TEXT | 描述 |
| settings | JSONB | 设置 |
| context | TEXT | 上下文 |
| issue_prefix | TEXT | Issue前缀 |
| issue_counter | INT | Issue计数器 |
| repos | JSONB | 仓库配置 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### 3. member - 成员关系表（用户 ↔ 工作空间）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| workspace_id | UUID | 外键，关联workspace |
| user_id | UUID | 外键，关联user |
| role | TEXT | 角色：owner/admin/member |
| created_at | TIMESTAMPTZ | 创建时间 |

### 4. agent - AI智能体

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| workspace_id | UUID | 外键，关联workspace |
| name | TEXT | 名称 |
| description | TEXT | 描述 |
| avatar_url | TEXT | 头像 |
| runtime_mode | TEXT | 运行模式：local/cloud |
| runtime_config | JSONB | 运行配置 |
| runtime_id | UUID | 运行时ID |
| visibility | TEXT | 可见性：workspace/private |
| status | TEXT | 状态：idle/working/blocked/error/offline |
| max_concurrent_tasks | INT | 最大并发任务数 |
| owner_id | UUID | 所有者 |
| instructions | TEXT | 指令 |
| archived_at | TIMESTAMPTZ | 归档时间 |
| archived_by | UUID | 归档人 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### 5. issue - 问题/任务

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| workspace_id | UUID | 外键，关联workspace |
| title | TEXT | 标题 |
| description | TEXT | 描述 |
| status | TEXT | 状态：backlog/todo/in_progress/in_review/done/blocked/cancelled |
| priority | TEXT | 优先级：urgent/high/medium/low/none |
| assignee_type | TEXT | 被指派人类型：member/agent |
| assignee_id | UUID | 被指派人ID |
| creator_type | TEXT | 创建人类型：member/agent |
| creator_id | UUID | 创建人ID |
| parent_issue_id | UUID | 父Issue ID（子任务） |
| acceptance_criteria | JSONB | 验收标准 |
| context_refs | JSONB | 上下文引用 |
| position | FLOAT | 排序位置 |
| due_date | TIMESTAMPTZ | 截止日期 |
| number | INT | Issue编号 |
| project_id | UUID | 所属项目 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### 6. project - 项目

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| workspace_id | UUID | 外键，关联workspace |
| title | TEXT | 项目名称 |
| description | TEXT | 描述 |
| icon | TEXT | 图标 |
| status | TEXT | 状态 |
| lead_type | TEXT | 负责人类型：member/agent |
| lead_id | UUID | 负责人ID |
| priority | TEXT | 优先级 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### 7. comment - 评论

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| issue_id | UUID | 外键，关联issue |
| workspace_id | UUID | 外键，关联workspace |
| author_type | TEXT | 作者类型：member/agent |
| author_id | UUID | 作者ID |
| content | TEXT | 内容 |
| type | TEXT | 类型：comment/status_change/progress_update/system |
| parent_id | UUID | 父评论ID（回复） |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### 8. agent_task_queue - Agent任务队列

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| agent_id | UUID | 外键，关联agent |
| runtime_id | UUID | 运行时ID |
| issue_id | UUID | 关联的issue（可为NULL，用于chat） |
| chat_session_id | UUID | 聊天会话ID |
| status | TEXT | 状态：queued/dispatched/running/completed/failed/cancelled |
| priority | INT | 优先级 |
| trigger_comment_id | UUID | 触发的评论ID |
| dispatched_at | TIMESTAMPTZ | 分发时间 |
| started_at | TIMESTAMPTZ | 开始时间 |
| completed_at | TIMESTAMPTZ | 完成时间 |
| result | JSONB | 结果 |
| error | TEXT | 错误信息 |
| session_id | TEXT | 会话ID（用于恢复） |
| work_dir | TEXT | 工作目录 |
| created_at | TIMESTAMPTZ | 创建时间 |

### 9. agent_runtime - Agent运行时

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| workspace_id | UUID | 外键，关联workspace |
| daemon_id | TEXT | 守护进程ID |
| name | TEXT | 名称 |
| runtime_mode | TEXT | 运行模式 |
| provider | TEXT | 提供商（claude/codex等） |
| status | TEXT | 状态：online/offline |
| device_info | JSONB | 设备信息 |
| metadata | JSONB | 元数据 |
| owner_id | UUID | 所有者 |
| last_seen_at | TIMESTAMPTZ | 最后活跃时间 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

## 辅助表

### 10. inbox_item - 通知/收件箱

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| workspace_id | UUID | 外键，关联workspace |
| recipient_type | TEXT | 接收人类型：member/agent |
| recipient_id | UUID | 接收人ID |
| type | TEXT | 类型 |
| severity | TEXT | 严重程度：action_required/attention/info |
| issue_id | UUID | 关联的issue |
| title | TEXT | 标题 |
| body | TEXT | 内容 |
| actor_type | TEXT | 操作者类型 |
| actor_id | UUID | 操作者ID |
| details | JSONB | 详情 |
| read | BOOLEAN | 已读 |
| archived | BOOLEAN | 已归档 |
| created_at | TIMESTAMPTZ | 创建时间 |

### 11. activity_log - 活动日志

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| workspace_id | UUID | 外键，关联workspace |
| issue_id | UUID | 关联的issue |
| actor_type | TEXT | 操作者类型：member/agent/system |
| actor_id | UUID | 操作者ID |
| action | TEXT | 动作类型 |
| details | JSONB | 详情 |
| created_at | TIMESTAMPTZ | 创建时间 |

### 12. chat_session - 聊天会话

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| workspace_id | UUID | 外键，关联workspace |
| agent_id | UUID | 关联的agent |
| creator_id | UUID | 创建人 |
| title | TEXT | 标题 |
| session_id | TEXT | 会话ID |
| work_dir | TEXT | 工作目录 |
| status | TEXT | 状态：active/archived |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### 13. chat_message - 聊天消息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| chat_session_id | UUID | 外键，关联chat_session |
| role | TEXT | 角色：user/assistant |
| content | TEXT | 内容 |
| task_id | UUID | 关联的任务 |
| created_at | TIMESTAMPTZ | 创建时间 |

### 14. attachment - 附件

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| workspace_id | UUID | 外键，关联workspace |
| issue_id | UUID | 关联的issue |
| comment_id | UUID | 关联的comment |
| uploader_type | TEXT | 上传者类型：member/agent |
| uploader_id | UUID | 上传者ID |
| filename | TEXT | 文件名 |
| url | TEXT | 文件URL |
| content_type | TEXT | 内容类型 |
| size_bytes | INT | 文件大小 |
| created_at | TIMESTAMPTZ | 创建时间 |

### 15. skill - 技能

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| workspace_id | UUID | 外键，关联workspace |
| name | TEXT | 名称 |
| description | TEXT | 描述 |
| content | TEXT | 内容 |
| config | JSONB | 配置 |
| created_by | UUID | 创建人 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### 16. skill_file - 技能文件

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| skill_id | UUID | 外键，关联skill |
| path | TEXT | 文件路径 |
| content | TEXT | 文件内容 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### 17. agent_skill - Agent-Skill关联表

| 字段 | 类型 | 说明 |
|------|------|------|
| agent_id | UUID | 外键，关联agent |
| skill_id | UUID | 外键，关联skill |

### 18. task_usage - 任务用量统计

| 字段 | 类型 | 说明 |
|------|------|------|
| task_id | UUID | 外键，关联agent_task_queue |
| provider | TEXT | 模型提供商 |
| model | TEXT | 模型名称 |
| input_tokens | INT | 输入token数 |
| output_tokens | INT | 输出token数 |
| cache_read_tokens | INT | 缓存读取token数 |
| cache_write_tokens | INT | 缓存写入token数 |

### 19. issue_subscriber - Issue订阅者

| 字段 | 类型 | 说明 |
|------|------|------|
| issue_id | UUID | 外键，关联issue |
| user_type | TEXT | 用户类型：member/agent |
| user_id | UUID | 用户ID |
| reason | TEXT | 订阅原因 |
| created_at | TIMESTAMPTZ | 创建时间 |

### 20. comment_reaction - 评论表情反应

| 字段 | 类型 | 说明 |
|------|------|------|
| comment_id | UUID | 外键，关联comment |
| workspace_id | UUID | 外键，关联workspace |
| actor_type | TEXT | 操作者类型：member/agent |
| actor_id | UUID | 操作者ID |
| emoji | TEXT | 表情 |
| created_at | TIMESTAMPTZ | 创建时间 |

### 21. pinned_item - 置顶项目

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| workspace_id | UUID | 外键，关联workspace |
| user_id | UUID | 用户ID |
| item_type | TEXT | 项目类型：issue等 |
| item_id | UUID | 项目ID |
| position | FLOAT | 位置 |
| created_at | TIMESTAMPTZ | 创建时间 |

### 22. issue_label - Issue标签

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| workspace_id | UUID | 外键，关联workspace |
| name | TEXT | 名称 |
| color | TEXT | 颜色 |

### 23. issue_to_label - Issue-Label关联表

| 字段 | 类型 | 说明 |
|------|------|------|
| issue_id | UUID | 外键，关联issue |
| label_id | UUID | 外键，关联issue_label |

### 24. issue_dependency - Issue依赖关系

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| issue_id | UUID | Issue ID |
| depends_on_issue_id | UUID | 依赖的Issue ID |
| type | TEXT | 依赖类型：blocks/blocked_by/related |

### 25. verification_code - 验证码

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| email | TEXT | 邮箱 |
| code | TEXT | 验证码 |
| expires_at | TIMESTAMPTZ | 过期时间 |
| attempts | INT | 尝试次数 |
| created_at | TIMESTAMPTZ | 创建时间 |

### 26. personal_access_token - 个人访问令牌

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 外键，关联user |
| name | TEXT | 名称 |
| token_hash | TEXT | 令牌哈希 |
| expires_at | TIMESTAMPTZ | 过期时间 |
| created_at | TIMESTAMPTZ | 创建时间 |

### 27. daemon_token - 守护进程令牌

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| workspace_id | UUID | 外键，关联workspace |
| name | TEXT | 名称 |
| token_hash | TEXT | 令牌哈希 |
| created_at | TIMESTAMPTZ | 创建时间 |

### 28. runtime_usage - 运行时用量

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| runtime_id | UUID | 运行时ID |
| date | DATE | 日期 |
| duration_seconds | INT | 运行时长（秒） |

### 29. task_message - 任务消息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| task_id | UUID | 外键，关联agent_task_queue |
| role | TEXT | 角色 |
| content | TEXT | 内容 |
| created_at | TIMESTAMPTZ | 创建时间 |

## 表关系图

```
workspace ──┬── member ── user
            ├── agent
            ├── issue ──┬── comment
            │           ├── activity_log
            │           ├── inbox_item
            │           ├── attachment
            │           ├── issue_subscriber
            │           ├── issue_to_label ── issue_label
            │           ├── issue_dependency
            │           └── parent_issue_id ── issue
            ├── project
            ├── skill ── skill_file
            │     └── agent_skill ── agent
            ├── agent_runtime
            ├── agent_task_queue ── task_usage
            │                      ── task_message
            ├── chat_session ── chat_message
            └── pinned_item
```