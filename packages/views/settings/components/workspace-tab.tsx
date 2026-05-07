"use client";

import { useEffect, useState } from "react";
import { Save, LogOut } from "lucide-react";
import { Input } from "@agentharness/ui/components/ui/input";
import { Textarea } from "@agentharness/ui/components/ui/textarea";
import { Label } from "@agentharness/ui/components/ui/label";
import { Button } from "@agentharness/ui/components/ui/button";
import { Card, CardContent } from "@agentharness/ui/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@agentharness/ui/components/ui/alert-dialog";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@agentharness/core/auth";
import { useWorkspaceStore } from "@agentharness/core/workspace";
import { useWorkspaceId } from "@agentharness/core/hooks";
import { memberListOptions } from "@agentharness/core/workspace/queries";
import { api } from "@agentharness/core/api";
import { useTranslation } from "@agentharness/core";

export function WorkspaceTab() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const workspace = useWorkspaceStore((s) => s.workspace);
  const wsId = useWorkspaceId();
  const { data: members = [] } = useQuery(memberListOptions(wsId));
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const leaveWorkspace = useWorkspaceStore((s) => s.leaveWorkspace);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);

  const [name, setName] = useState(workspace?.name ?? "");
  const [description, setDescription] = useState(workspace?.description ?? "");
  const [context, setContext] = useState(workspace?.context ?? "");
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    variant?: "destructive";
    onConfirm: () => Promise<void>;
  } | null>(null);

  const currentMember = members.find((m) => m.user_id === user?.id) ?? null;
  const canManageWorkspace = currentMember?.role === "owner" || currentMember?.role === "admin";
  const isOwner = currentMember?.role === "owner";

  useEffect(() => {
    setName(workspace?.name ?? "");
    setDescription(workspace?.description ?? "");
    setContext(workspace?.context ?? "");
  }, [workspace]);

  const handleSave = async () => {
    if (!workspace) return;
    setSaving(true);
    try {
      const updated = await api.updateWorkspace(workspace.id, {
        name,
        description,
        context,
      });
      updateWorkspace(updated);
      toast.success(t("settings.workspace.settingsSaved", "Workspace settings saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("settings.workspace.failedToSave", "Failed to save workspace settings"));
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveWorkspace = () => {
    if (!workspace) return;
    setConfirmAction({
      title: t("settings.workspace.leaveWorkspace", "Leave workspace"),
      description: t("settings.workspace.leaveWarning", "You will lose access until re-invited."),
      variant: "destructive",
      onConfirm: async () => {
        setActionId("leave");
        try {
          await leaveWorkspace(workspace.id);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : t("settings.workspace.failedToLeave", "Failed to leave workspace"));
        } finally {
          setActionId(null);
        }
      },
    });
  };

  const handleDeleteWorkspace = () => {
    if (!workspace) return;
    setConfirmAction({
      title: t("settings.workspace.deleteWorkspace", "Delete workspace"),
      description: t("settings.workspace.deleteWarning", "This cannot be undone. All issues, agents, and data will be permanently removed."),
      variant: "destructive",
      onConfirm: async () => {
        setActionId("delete-workspace");
        try {
          await deleteWorkspace(workspace.id);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : t("settings.workspace.failedToDelete", "Failed to delete workspace"));
        } finally {
          setActionId(null);
        }
      },
    });
  };

  if (!workspace) return null;

  return (
    <div className="space-y-8">
      {/* Workspace settings */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">{t("settings.workspace.title", "General")}</h2>

        <Card>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t("settings.workspace.name", "Name")}</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canManageWorkspace}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t("settings.workspace.description", "Description")}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={!canManageWorkspace}
                className="mt-1 resize-none"
                placeholder={t("settings.workspace.focusPlaceholder", "What does this workspace focus on?")}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t("settings.workspace.context", "Context")}</Label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={4}
                disabled={!canManageWorkspace}
                className="mt-1 resize-none"
                placeholder={t("settings.workspace.contextDescription", "Background information and context for AI agents working in this workspace")}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t("settings.workspace.slug", "Slug")}</Label>
              <div className="mt-1 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                {workspace.slug}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !name.trim() || !canManageWorkspace}
              >
                <Save className="h-3 w-3" />
                {saving ? t("settings.workspace.saving", "Saving...") : t("settings.workspace.save", "Save")}
              </Button>
            </div>
            {!canManageWorkspace && (
              <p className="text-xs text-muted-foreground">
                {t("settings.workspace.permissionNotice", "Only admins and owners can update workspace settings.")}
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <LogOut className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">{t("settings.workspace.dangerZone", "Danger Zone")}</h2>
        </div>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">{t("settings.workspace.leaveWorkspace", "Leave workspace")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("settings.workspace.leaveDescription", "Remove yourself from this workspace.")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLeaveWorkspace}
                disabled={actionId === "leave"}
              >
                {actionId === "leave" ? t("settings.workspace.leaving", "Leaving...") : t("settings.workspace.leaveConfirm", "Leave workspace")}
              </Button>
            </div>

            {isOwner && (
              <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-destructive">{t("settings.workspace.deleteWorkspace", "Delete workspace")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.workspace.deleteDescription", "Permanently delete this workspace and its data.")}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteWorkspace}
                  disabled={actionId === "delete-workspace"}
                >
                  {actionId === "delete-workspace" ? t("settings.workspace.deleting", "Deleting...") : t("settings.workspace.deleteConfirm", "Delete workspace")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <AlertDialog open={!!confirmAction} onOpenChange={(v) => { if (!v) setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("settings.workspace.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmAction?.variant === "destructive" ? "destructive" : "default"}
              onClick={async () => {
                await confirmAction?.onConfirm();
                setConfirmAction(null);
              }}
            >
              {t("settings.workspace.confirm", "Confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
