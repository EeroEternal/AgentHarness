import type { AgentStatus } from "@agentharness/core/types";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
} from "lucide-react";

export const statusConfig: Record<AgentStatus, { labelKey: string; defaultLabel: string; color: string; dot: string }> = {
  idle: { labelKey: "agents.status.idle", defaultLabel: "Idle", color: "text-muted-foreground", dot: "bg-muted-foreground" },
  working: { labelKey: "agents.status.working", defaultLabel: "Working", color: "text-success", dot: "bg-success" },
  blocked: { labelKey: "agents.status.blocked", defaultLabel: "Blocked", color: "text-warning", dot: "bg-warning" },
  error: { labelKey: "agents.status.error", defaultLabel: "Error", color: "text-destructive", dot: "bg-destructive" },
  offline: { labelKey: "agents.status.offline", defaultLabel: "Offline", color: "text-muted-foreground/50", dot: "bg-muted-foreground/40" },
};

export const taskStatusConfig: Record<string, { labelKey: string; defaultLabel: string; icon: typeof CheckCircle2; color: string }> = {
  queued: { labelKey: "agents.taskStatus.queued", defaultLabel: "Queued", icon: Clock, color: "text-muted-foreground" },
  dispatched: { labelKey: "agents.taskStatus.dispatched", defaultLabel: "Dispatched", icon: Play, color: "text-info" },
  running: { labelKey: "agents.taskStatus.running", defaultLabel: "Running", icon: Loader2, color: "text-success" },
  completed: { labelKey: "agents.taskStatus.completed", defaultLabel: "Completed", icon: CheckCircle2, color: "text-success" },
  failed: { labelKey: "agents.taskStatus.failed", defaultLabel: "Failed", icon: XCircle, color: "text-destructive" },
  cancelled: { labelKey: "agents.taskStatus.cancelled", defaultLabel: "Cancelled", icon: XCircle, color: "text-muted-foreground" },
};
