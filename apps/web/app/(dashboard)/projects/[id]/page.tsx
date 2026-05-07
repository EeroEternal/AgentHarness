"use client";

import { use } from "react";
import { useLocale } from "@/features/landing/i18n/context";
import { en } from "@/features/landing/i18n/en";
import { zh } from "@/features/landing/i18n/zh";
import { ProjectDetail } from "@agentharness/views/projects/components";

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { locale } = useLocale();
  const dict = locale === "zh" ? zh : en;

  const t = (key: string, fallback: string) => {
    const value = getNestedValue(dict, key);
    return typeof value === "string" ? value : fallback;
  };

  return <ProjectDetail projectId={id} t={t} />;
}