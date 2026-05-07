"use client";

import { IssuesPage } from "@agentharness/views/issues/components";
import { useLocale } from "@/features/landing/i18n/context";
import { en } from "@/features/landing/i18n/en";
import { zh } from "@/features/landing/i18n/zh";
import { Button } from "@agentharness/ui/components/ui/button";
import { Globe } from "lucide-react";

// 简单的嵌套对象查找辅助函数，用于替代复杂的递归查找
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

export default function Page() {
  const { locale, setLocale } = useLocale();
  const dict = locale === "zh" ? zh : en;

  // 统一的翻译辅助函数
  const t = (key: string, fallback: string) => {
    const value = getNestedValue(dict, key);
    return typeof value === "string" ? value : fallback;
  };

  const toggleLanguage = () => {
    setLocale(locale === "zh" ? "en" : "zh");
  };

  // 定义 Header 右侧的切换按钮
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

  return (
    <div className="flex flex-col h-full relative">
      <IssuesPage t={t} headerActions={headerActions} />
    </div>
  );
}
