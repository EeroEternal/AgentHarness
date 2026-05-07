"use client";

import { Search } from "lucide-react";
import { SidebarMenuButton } from "@agentharness/ui/components/ui/sidebar";
import { useSearchStore } from "./search-store";
import { useTranslation } from "@agentharness/core";

export function SearchTrigger() {
  const { t } = useTranslation();
  return (
    <SidebarMenuButton
      className="text-muted-foreground"
      onClick={() => useSearchStore.getState().setOpen(true)}
    >
      <Search />
      <span>{t("search.trigger", "Search...")}</span>
      <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span className="text-xs">⌘</span>K
      </kbd>
    </SidebarMenuButton>
  );
}
