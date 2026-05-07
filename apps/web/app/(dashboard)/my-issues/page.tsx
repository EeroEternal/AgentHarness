"use client";

import { MyIssuesPage } from "@agentharness/views/my-issues";
import { useLocale } from "@/features/landing/i18n/context";
import { en } from "@/features/landing/i18n/en";
import { zh } from "@/features/landing/i18n/zh";
import { Button } from "@agentharness/ui/components/ui/button";
import { Globe } from "lucide-react";

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

export default function Page() {
  const { locale, setLocale } = useLocale();
  const dict = locale === "zh" ? zh : en;

  const t = (key: string, fallback: string) => {
    const value = getNestedValue(dict, key);
    return typeof value === "string" ? value : fallback;
  };

  const toggleLanguage = () => {
    setLocale(locale === "zh" ? "en" : "zh");
  };

  const headerActions = (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 h-8 px-2 text-muted-foreground hover:text-foreground"
      title={locale === "zh" ? "Switch to English" : "切换到中文"}
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-medium">
        {locale === "zh" ? "EN" : "中文"}
      </span>
    </Button>
  );

  return <MyIssuesPage t={t} headerActions={headerActions} />;
}
