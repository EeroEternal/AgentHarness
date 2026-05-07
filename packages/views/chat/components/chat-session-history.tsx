"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare, Archive, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@agentharness/ui/components/ui/avatar";
import { Bot } from "lucide-react";
import { useWorkspaceId } from "@agentharness/core/hooks";
import { agentListOptions } from "@agentharness/core/workspace/queries";
import { allChatSessionsOptions } from "@agentharness/core/chat/queries";
import { useArchiveChatSession } from "@agentharness/core/chat/mutations";
import { useChatStore } from "@agentharness/core/chat";
import { useTranslation } from "@agentharness/core";
import type { ChatSession, Agent } from "@agentharness/core/types";

export function ChatSessionHistory() {
  const { t } = useTranslation();
  const wsId = useWorkspaceId();
  const setShowHistory = useChatStore((s) => s.setShowHistory);
  const setActiveSession = useChatStore((s) => s.setActiveSession);
  const clearTimeline = useChatStore((s) => s.clearTimeline);
  const setPendingTask = useChatStore((s) => s.setPendingTask);
  const activeSessionId = useChatStore((s) => s.activeSessionId);

  const { data: sessions = [] } = useQuery(allChatSessionsOptions(wsId));
  const { data: agents = [] } = useQuery(agentListOptions(wsId));
  const archiveSession = useArchiveChatSession();

  const agentMap = new Map(agents.map((a) => [a.id, a]));

  const handleSelectSession = (session: ChatSession) => {
    setActiveSession(session.id);
    clearTimeline();
    setPendingTask(null);
    setShowHistory(false);
  };

  const handleArchive = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    archiveSession.mutate(sessionId);
    if (activeSessionId === sessionId) {
      setActiveSession(null);
    }
  };

  const activeSessions = sessions.filter((s) => s.status === "active");
  const archivedSessions = sessions.filter((s) => s.status === "archived");

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <button
          onClick={() => setShowHistory(false)}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="size-3.5" />
        </button>
        <span className="text-sm font-medium">{t("chat.chatHistory", "Chat History")}</span>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <MessageSquare className="size-6" />
            <span className="text-sm">{t("chat.noChatSessions", "No chat sessions yet")}</span>
          </div>
        ) : (
          <>
            {activeSessions.length > 0 && (
              <SessionGroup
                label={t("chat.active", "Active")}
                sessions={activeSessions}
                agentMap={agentMap}
                activeSessionId={activeSessionId}
                onSelect={handleSelectSession}
                onArchive={handleArchive}
                timeAgoLabels={{
                  justNow: t("chat.justNow", "just now"),
                  minutesAgo: t("chat.minutesAgo", "m ago"),
                  hoursAgo: t("chat.hoursAgo", "h ago"),
                  daysAgo: t("chat.daysAgo", "d ago"),
                }}
                untitled={t("chat.untitled", "Untitled")}
                archive={t("chat.archive", "Archive")}
              />
            )}
            {archivedSessions.length > 0 && (
              <SessionGroup
                label={t("chat.archived", "Archived")}
                sessions={archivedSessions}
                agentMap={agentMap}
                activeSessionId={activeSessionId}
                onSelect={handleSelectSession}
                timeAgoLabels={{
                  justNow: t("chat.justNow", "just now"),
                  minutesAgo: t("chat.minutesAgo", "m ago"),
                  hoursAgo: t("chat.hoursAgo", "h ago"),
                  daysAgo: t("chat.daysAgo", "d ago"),
                }}
                untitled={t("chat.untitled", "Untitled")}
                archive={t("chat.archive", "Archive")}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SessionGroup({
  label,
  sessions,
  agentMap,
  activeSessionId,
  onSelect,
  onArchive,
  timeAgoLabels,
  untitled,
  archive,
}: {
  label: string;
  sessions: ChatSession[];
  agentMap: Map<string, Agent>;
  activeSessionId: string | null;
  onSelect: (session: ChatSession) => void;
  onArchive?: (e: React.MouseEvent, sessionId: string) => void;
  timeAgoLabels: {
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
  };
  untitled: string;
  archive: string;
}) {
  return (
    <div>
      <div className="px-4 pt-3 pb-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      {sessions.map((session) => (
        <SessionItem
          key={session.id}
          session={session}
          agent={agentMap.get(session.agent_id) ?? null}
          isActive={session.id === activeSessionId}
          onSelect={() => onSelect(session)}
          onArchive={onArchive ? (e) => onArchive(e, session.id) : undefined}
          timeAgoLabels={timeAgoLabels}
          untitled={untitled}
          archive={archive}
        />
      ))}
    </div>
  );
}

function SessionItem({
  session,
  agent,
  isActive,
  onSelect,
  onArchive,
  timeAgoLabels,
  untitled,
  archive,
}: {
  session: ChatSession;
  agent: Agent | null;
  isActive: boolean;
  onSelect: () => void;
  onArchive?: (e: React.MouseEvent) => void;
  timeAgoLabels: {
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
  };
  untitled: string;
  archive: string;
}) {
  const timeAgo = formatTimeAgo(session.updated_at, timeAgoLabels);

  return (
    <button
      onClick={onSelect}
      className={`group flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent/50 ${
        isActive ? "bg-accent/30" : ""
      }`}
    >
      <Avatar className="size-6 shrink-0 mt-0.5">
        {agent?.avatar_url && <AvatarImage src={agent.avatar_url} />}
        <AvatarFallback className="bg-purple-100 text-purple-700 text-[10px]">
          <Bot className="size-3" />
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {session.title || untitled}
          </span>
          {session.status === "archived" && (
            <Archive className="size-3 shrink-0 text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {agent && (
            <span className="text-xs text-muted-foreground truncate">
              {agent.name}
            </span>
          )}
          <span className="text-xs text-muted-foreground/60">{timeAgo}</span>
        </div>
      </div>
      {onArchive && (
        <button
          onClick={onArchive}
          title={archive}
          className="invisible group-hover:visible flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-destructive shrink-0 mt-0.5"
        >
          <Trash2 className="size-3" />
        </button>
      )}
    </button>
  );
}

function formatTimeAgo(
  dateStr: string,
  labels: { justNow: string; minutesAgo: string; hoursAgo: string; daysAgo: string }
): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return labels.justNow;
  if (diffMins < 60) return `${diffMins}${labels.minutesAgo}`;
  if (diffHours < 24) return `${diffHours}${labels.hoursAgo}`;
  if (diffDays < 7) return `${diffDays}${labels.daysAgo}`;
  return date.toLocaleDateString();
}
