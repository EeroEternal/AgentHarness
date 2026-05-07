"use client";

import { useTheme } from "@agentharness/ui/components/common/theme-provider";
import { useI18nStore, useTranslation } from "@agentharness/core";
import { cn } from "@agentharness/ui/lib/utils";

const LIGHT_COLORS = {
  titleBar: "#e8e8e8",
  content: "#ffffff",
  sidebar: "#f4f4f5",
  bar: "#e4e4e7",
  barMuted: "#d4d4d8",
};

const DARK_COLORS = {
  titleBar: "#333338",
  content: "#27272a",
  sidebar: "#1e1e21",
  bar: "#3f3f46",
  barMuted: "#52525b",
};

function WindowMockup({
  variant,
  className,
}: {
  variant: "light" | "dark";
  className?: string;
}) {
  const colors = variant === "light" ? LIGHT_COLORS : DARK_COLORS;

  return (
    <div className={cn("flex h-full w-full flex-col", className)}>
      {/* Title bar */}
      <div
        className="flex items-center gap-[3px] px-2 py-1.5"
        style={{ backgroundColor: colors.titleBar }}
      >
        <span className="size-[6px] rounded-full bg-[#ff5f57]" />
        <span className="size-[6px] rounded-full bg-[#febc2e]" />
        <span className="size-[6px] rounded-full bg-[#28c840]" />
      </div>
      {/* Content area */}
      <div
        className="flex flex-1"
        style={{ backgroundColor: colors.content }}
      >
        {/* Sidebar */}
        <div
          className="w-[30%] space-y-1 p-2"
          style={{ backgroundColor: colors.sidebar }}
        >
          <div
            className="h-1 w-3/4 rounded-full"
            style={{ backgroundColor: colors.bar }}
          />
          <div
            className="h-1 w-1/2 rounded-full"
            style={{ backgroundColor: colors.bar }}
          />
        </div>
        {/* Main */}
        <div className="flex-1 space-y-1.5 p-2">
          <div
            className="h-1.5 w-4/5 rounded-full"
            style={{ backgroundColor: colors.bar }}
          />
          <div
            className="h-1 w-full rounded-full"
            style={{ backgroundColor: colors.barMuted }}
          />
          <div
            className="h-1 w-3/5 rounded-full"
            style={{ backgroundColor: colors.barMuted }}
          />
        </div>
      </div>
    </div>
  );
}

export function AppearanceTab() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useI18nStore();

  const themeOptions = [
    { value: "light" as const, label: t("settings.appearance.light", "Light") },
    { value: "dark" as const, label: t("settings.appearance.dark", "Dark") },
    { value: "system" as const, label: t("settings.appearance.system", "System") },
  ];

  const languageOptions = [
    { value: "en" as const, label: t("settings.appearance.english", "English") },
    { value: "zh" as const, label: t("settings.appearance.chinese", "中文") },
  ];

  const handleLanguageChange = (newLanguage: "en" | "zh") => {
    setLanguage(newLanguage);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">{t("settings.appearance.theme", "Theme")}</h2>
        <div className="flex gap-6" role="radiogroup" aria-label={t("settings.appearance.theme", "Theme")}>
          {themeOptions.map((opt) => {
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                role="radio"
                aria-checked={active}
                aria-label={`Select ${opt.label} theme`}
                onClick={() => setTheme(opt.value)}
                className="group flex flex-col items-center gap-2"
              >
                <div
                  className={cn(
                    "aspect-[4/3] w-36 overflow-hidden rounded-lg ring-1 transition-all",
                    active
                      ? "ring-2 ring-brand"
                      : "ring-border hover:ring-2 hover:ring-border"
                  )}
                >
                  {opt.value === "system" ? (
                    <div className="relative h-full w-full">
                      <WindowMockup
                        variant="light"
                        className="absolute inset-0"
                      />
                      <WindowMockup
                        variant="dark"
                        className="absolute inset-0 [clip-path:inset(0_0_0_50%)]"
                      />
                    </div>
                  ) : (
                    <WindowMockup variant={opt.value} />
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm transition-colors",
                    active
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">{t("settings.appearance.language", "Language")}</h2>
        <div className="flex gap-6" role="radiogroup" aria-label={t("settings.appearance.language", "Language")}>
          {languageOptions.map((opt) => {
            const active = language === opt.value;
            return (
              <button
                key={opt.value}
                role="radio"
                aria-checked={active}
                aria-label={`Select ${opt.label} language`}
                onClick={() => handleLanguageChange(opt.value)}
                className="group flex flex-col items-center gap-2"
              >
                <div
                  className={cn(
                    "flex aspect-[4/3] w-36 items-center justify-center rounded-lg ring-1 transition-all",
                    active
                      ? "ring-2 ring-brand bg-accent"
                      : "ring-border hover:ring-2 hover:ring-border hover:bg-accent/50"
                  )}
                >
                  <span className="text-2xl font-bold text-muted-foreground">
                    {opt.value === "en" ? "EN" : "中"}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-sm transition-colors",
                    active
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
