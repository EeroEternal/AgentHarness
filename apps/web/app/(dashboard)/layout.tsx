"use client";

import { DashboardLayout } from "@agentharness/views/layout";
import { SearchCommand, SearchTrigger } from "@agentharness/views/search";
import { ChatFab, ChatWindow } from "@agentharness/views/chat";
import { LocaleProvider, useLocale } from "@/features/landing/i18n/context";
import { en } from "@/features/landing/i18n/en";
import { zh } from "@/features/landing/i18n/zh";
import { useI18nStore } from "@agentharness/core";
import type { ReactNode } from "react";

function getNestedValue(obj: any, path: string): any {
  // return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  if (path === "sidebar.workspace") {
    console.log("[Debug] Looking for sidebar.workspace");
    console.log("[Debug] Current Dict Keys:", Object.keys(obj)); // 看看顶层有哪些键
    console.log("[Debug] obj.sidebar exists?", !!obj.sidebar);
    if (obj.sidebar) {
      console.log("[Debug] obj.sidebar Keys:", Object.keys(obj.sidebar)); // 看看 sidebar 里有哪些键
      console.log(
        "[Debug] obj.sidebar.workspace value:",
        obj.sidebar.workspace,
      );
    }
  }
  return path.split(".").reduce((acc, part) => {
    const next = acc && acc[part];
    if (path === "sidebar.workspace" && part === "workspace") {
      console.log(`[Debug] Step '${part}':`, next);
    }
    return next;
  }, obj);
}

function getInitialLocale(): "en" | "zh" {
  if (typeof window === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)harness-locale=(\w+)/);
  const locale = match?.[1];
  return locale === "zh" ? "zh" : "en";
}

function DashboardLayoutWithI18n({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
   // 【新增】打印当前语言
  console.log('[i18n] Current Locale:', locale); 
  const dict = locale === "zh" ? zh : en;

  const t = (key: string, fallback: string) => {
    const value = getNestedValue(dict, key);
    return typeof value === "string" ? value : fallback;
  };

  return (
    <DashboardLayout
      t={t}
      loadingIndicator={
        <div
          aria-hidden="true"
          className="size-6 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
        />
      }
      searchSlot={<SearchTrigger />}
      extra={
        <>
          <SearchCommand />
          <ChatWindow />
          <ChatFab />
        </>
      }
    >
      {children}
    </DashboardLayout>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const initialLocale = getInitialLocale();
  
  return (
    <LocaleProvider initialLocale={initialLocale}>
      <DashboardLayoutWithI18n>{children}</DashboardLayoutWithI18n>
    </LocaleProvider>
  );
}
