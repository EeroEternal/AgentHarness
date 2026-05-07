"use client";

import { use } from "react";
import { IssueDetail } from "@agentharness/views/issues/components";
import { useLocale } from "@/features/landing/i18n/context";
import { en } from "@/features/landing/i18n/en";
import { zh } from "@/features/landing/i18n/zh";

// 简单的嵌套对象查找辅助函数
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

export default function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { locale } = useLocale();
  const dict = locale === "zh" ? zh : en;

  // 统一的翻译辅助函数
  const t = (key: string, fallback: string) => {
    const value = getNestedValue(dict, key);
    return typeof value === "string" ? value : fallback;
  };

  return <IssueDetail issueId={id} t={t} />;
}
