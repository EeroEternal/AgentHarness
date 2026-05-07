"use client";

import { useEffect } from "react";
import { useNavigationStore } from "@agentharness/core/navigation";
import { useAuthStore } from "@agentharness/core/auth";
import { useWorkspaceStore } from "@agentharness/core/workspace";
import { useNavigation } from "../navigation";

export function useDashboardGuard(loginPath = "/") {
  const { pathname, push } = useNavigation();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const workspace = useWorkspaceStore((s) => s.workspace);

  useEffect(() => {
    if (!isLoading && !user) push(loginPath);
  }, [user, isLoading, push, loginPath]);

  useEffect(() => {
    useNavigationStore.getState().onPathChange(pathname);
  }, [pathname]);

  return { user, isLoading, workspace };
}
