"use client";

import { useLocale } from "@/features/landing/i18n/context";
import { en } from "@/features/landing/i18n/en";
import { zh } from "@/features/landing/i18n/zh";
import { InboxPage } from "@agentharness/views/inbox";

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

export default function Page() {
  const { locale } = useLocale();
  const dict = locale === "zh" ? zh : en;

  const t = (key: string, fallback: string) => {
    const value = getNestedValue(dict, key);
    return typeof value === "string" ? value : fallback;
  };

  return <InboxPage t={t} />;
}