"use client";

import Link from "next/link";
import { cn } from "@agentharness/ui/lib/utils";
import { useAuthStore } from "@agentharness/core/auth";
import { GitHubMark, githubUrl } from "./shared";
import { useLocale, locales, localeLabels } from "../i18n";

export function LandingFooter() {
  const { t, locale, setLocale } = useLocale();
  const user = useAuthStore((s) => s.user);
  const groups = Object.values(t.footer.groups);
  const brandLabel = locale === "zh" ? "Agent 交付系统" : "Agent Delivery OS";

  return (
    <footer className="border-t border-[#122033]/8 bg-white/62 text-[#122033]">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-14">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-[14px] border border-[#122033]/12 bg-white/80 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c6730]">
                H
              </span>
              <div>
                <div className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-[#8c6730]">
                  {brandLabel}
                </div>
                <div className="text-[1rem] font-semibold tracking-[0.08em] text-[#122033]">
                  Harness
                </div>
              </div>
            </Link>

            <p className="mt-4 max-w-[34rem] text-sm leading-7 text-[#122033]/56">
              {t.footer.tagline}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={user ? "/issues" : "/login"}
                className="inline-flex items-center justify-center rounded-[16px] bg-[#122033] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1a2c46]"
              >
                {user ? t.header.dashboard : t.footer.cta}
              </Link>
              <Link
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-[16px] border border-[#122033]/10 bg-white/74 px-4 py-2.5 text-[13px] font-medium text-[#122033] transition-colors hover:bg-white"
              >
                <GitHubMark className="size-4" />
                GitHub
              </Link>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.label}>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6730]">
                  {group.label}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        {...(link.href.startsWith("http")
                          ? { target: "_blank", rel: "noreferrer" }
                          : {})}
                        className="text-sm text-[#122033]/56 transition-colors hover:text-[#122033]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#122033]/8 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-[#122033]/40">
            {t.footer.copyright.replace(
              "{year}",
              String(new Date().getFullYear()),
            )}
          </p>
          <div className="flex items-center gap-2 rounded-[16px] border border-[#122033]/10 bg-[#fcfaf6] p-1">
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={cn(
                  "rounded-[12px] px-3 py-1.5 text-xs font-medium transition-colors",
                  l === locale
                    ? "bg-[#122033] text-white"
                    : "text-[#122033]/56 hover:text-[#122033]",
                )}
              >
                {localeLabels[l]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
