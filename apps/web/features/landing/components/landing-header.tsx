"use client";

import Link from "next/link";
import { cn } from "@agentharness/ui/lib/utils";
import { useAuthStore } from "@agentharness/core/auth";
import { localeLabels, locales, useLocale } from "../i18n";
import { GitHubMark, githubUrl } from "./shared";

export function LandingHeader({
  variant = "dark",
}: {
  variant?: "dark" | "light";
}) {
  const { t, locale, setLocale } = useLocale();
  const user = useAuthStore((s) => s.user);
  const brandLabel = locale === "zh" ? "Agent 交付系统" : "Agent Delivery OS";

  return (
    <header
      className={cn(
        "sticky inset-x-0 top-0 z-40 border-b backdrop-blur-xl",
        variant === "dark"
          ? "border-white/12 bg-[#0f1a2c]/72"
          : "border-[#122033]/8 bg-[#f4efe6]/88",
      )}
    >
      <div className="mx-auto flex min-h-[76px] max-w-[1360px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-[14px] border text-[11px] font-semibold uppercase tracking-[0.22em]",
              variant === "dark"
                ? "border-white/16 bg-white/8 text-white"
                : "border-[#122033]/12 bg-white/80 text-[#8c6730]",
            )}
          >
            H
          </span>
          <div>
            <div
              className={cn(
                "text-[0.68rem] font-medium uppercase tracking-[0.22em]",
                variant === "dark" ? "text-white/45" : "text-[#8c6730]",
              )}
            >
              {brandLabel}
            </div>
            <div
              className={cn(
                "text-[1rem] font-semibold tracking-[0.08em] sm:text-[1.04rem]",
                variant === "dark" ? "text-white" : "text-[#122033]",
              )}
            >
              Harness
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <div
            className={cn(
              "hidden items-center overflow-hidden border p-1 md:flex",
              variant === "dark"
                ? "rounded-[16px] border-white/14 bg-white/6"
                : "rounded-[16px] border-[#122033]/10 bg-white/72",
            )}
          >
            {locales.map((item) => (
              <button
                key={item}
                onClick={() => setLocale(item)}
                className={cn(
                  "rounded-[12px] px-3 py-1.5 text-xs font-medium transition-colors",
                  item === locale
                    ? variant === "dark"
                      ? "bg-white text-[#122033]"
                      : "bg-[#122033] text-white"
                    : variant === "dark"
                      ? "text-white/56 hover:text-white"
                      : "text-[#122033]/56 hover:text-[#122033]",
                )}
              >
                {localeLabels[item]}
              </button>
            ))}
          </div>
          <Link
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "hidden items-center gap-2 px-4 py-2 text-sm font-medium transition-colors md:inline-flex",
              variant === "dark"
                ? "rounded-[16px] border border-white/14 bg-white/6 text-white hover:bg-white/10"
                : "rounded-[16px] border border-[#122033]/10 bg-white/72 text-[#122033] hover:bg-white",
            )}
          >
            <GitHubMark className="size-3.5" />
            {t.header.github}
          </Link>
          <Link
            href={user ? "/issues" : "/login"}
            className={cn(
              "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors",
              variant === "dark"
                ? "rounded-[16px] bg-white text-[#122033] hover:bg-white/90"
                : "rounded-[16px] bg-[#122033] text-white hover:bg-[#1a2c46]",
            )}
          >
            {user ? t.header.dashboard : t.header.login}
          </Link>
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden sm:px-6 lg:px-8">
        <div
          className={cn(
            "inline-flex items-center overflow-hidden border p-1",
            variant === "dark"
              ? "rounded-[14px] border-white/14 bg-white/6"
              : "rounded-[14px] border-[#122033]/10 bg-white/72",
          )}
        >
          {locales.map((item) => (
            <button
              key={item}
              onClick={() => setLocale(item)}
              className={cn(
                "rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors",
                item === locale
                  ? variant === "dark"
                    ? "bg-white text-[#122033]"
                    : "bg-[#122033] text-white"
                  : variant === "dark"
                    ? "text-white/56 hover:text-white"
                    : "text-[#122033]/56 hover:text-[#122033]",
              )}
            >
              {localeLabels[item]}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
