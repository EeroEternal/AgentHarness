"use client";

import { LandingHeader } from "./landing-header";
import { LandingFooter } from "./landing-footer";
import { cn } from "@agentharness/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLocale } from "../i18n";

function ChangeList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-2">
      {items.map((change) => (
        <li
          key={change}
          className="flex items-start gap-2.5 text-[14px] leading-[1.7] text-[#0a0d12]/60 sm:text-[15px]"
        >
          <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[#0a0d12]/30" />
          {change}
        </li>
      ))}
    </ul>
  );
}

export function ChangelogPageClient() {
  const { t, locale } = useLocale();
  const categoryLabels = t.changelog.categories;
  const latest = t.changelog.entries[0];
  const releaseCount = t.changelog.entries.length;
  const latestVersion = latest?.version ?? "0.2.2";
  const serifClass =
    locale === "zh"
      ? "font-[family:var(--font-serif-zh)]"
      : "font-[family:var(--font-serif)]";
  const latestItemCount =
    (latest?.features?.length ?? 0) +
    (latest?.improvements?.length ?? 0) +
    (latest?.fixes?.length ?? 0) +
    (latest?.changes.length ?? 0);
  const labels =
    locale === "zh"
      ? {
          eyebrow: "产品发布",
          backHome: "返回首页",
          snapshot: "发布快照",
          latestVersion: "最新版本",
          latestItems: "最新版本事项数",
          published: "累计发布版本",
          releaseNote: "发布记录",
        }
      : {
          eyebrow: "Product releases",
          backHome: "Back to Homepage",
          snapshot: "Release snapshot",
          latestVersion: "Latest version",
          latestItems: "Items in latest release",
          published: "Published releases",
          releaseNote: "Release note",
        };

  return (
    <>
      <LandingHeader variant="light" />
      <main className="relative overflow-hidden bg-[#f4efe6] text-[#122033]">
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,#f4efe6_0%,#f6f1e7_46%,#f2ebde_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_16%_20%,rgba(181,145,80,0.12),transparent_28%),radial-gradient(circle_at_85%_8%,rgba(18,32,51,0.08),transparent_34%)]" />

        <div className="mx-auto max-w-[1360px] px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="max-w-[820px]">
              <div className="inline-flex items-center rounded-[14px] border border-[#8c6730]/15 bg-white/72 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8c6730]">
                {labels.eyebrow}
              </div>
              <h1 className={cn("mt-6 max-w-[11ch] text-[clamp(3rem,6vw,5.4rem)] leading-[0.94] tracking-[-0.06em] text-[#122033]", serifClass)}>
                {t.changelog.title}
              </h1>
              <p className="mt-5 max-w-[60ch] text-[1.06rem] leading-8 text-[#122033]/68">
                {t.changelog.subtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#122033] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a2c46]"
                >
                  {labels.backHome}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            <aside className="rounded-[28px] border border-[#122033]/10 bg-[#0f1a2c] p-6 text-white shadow-[0_40px_110px_-80px_rgba(8,12,20,0.72)] sm:p-8">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d5b27a]">
                {labels.snapshot}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[16px] border border-white/8 bg-white/6 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/44">{labels.latestVersion}</div>
                  <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">v{latestVersion}</div>
                </div>
                <div className="rounded-[16px] border border-white/8 bg-white/6 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/44">{labels.latestItems}</div>
                  <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{latestItemCount}</div>
                </div>
                <div className="rounded-[16px] border border-white/8 bg-white/6 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/44">{labels.published}</div>
                  <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{releaseCount}</div>
                </div>
              </div>
            </aside>
          </section>

          <div className="mt-12 space-y-8">
            {t.changelog.entries.map((release) => {
              const hasCategorized =
                release.features || release.improvements || release.fixes;

              return (
                <article
                  key={release.version}
                  className="rounded-[26px] border border-[#122033]/10 bg-white/82 p-6 shadow-[0_28px_90px_-76px_rgba(18,32,51,0.5)] sm:p-8"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-[13px] font-semibold tabular-nums text-[#122033]">
                          v{release.version}
                        </span>
                        <span className="text-[13px] text-[#122033]/40">
                          {release.date}
                        </span>
                      </div>
                      <h2 className="mt-2 text-[22px] font-semibold leading-snug tracking-[-0.03em] text-[#122033] sm:text-[24px]">
                        {release.title}
                      </h2>
                    </div>
                    <div className="rounded-[14px] border border-[#122033]/10 bg-[#fcfaf6] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8c6730]">
                      {labels.releaseNote}
                    </div>
                  </div>

                  {hasCategorized ? (
                    <div className="mt-6 grid gap-6 xl:grid-cols-3">
                      {release.features && release.features.length > 0 && (
                        <div className="rounded-[18px] border border-[#122033]/8 bg-[#fcfaf6] p-5">
                          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6730]">
                            {categoryLabels.features}
                          </h3>
                          <ChangeList items={release.features} />
                        </div>
                      )}
                      {release.improvements &&
                        release.improvements.length > 0 && (
                          <div className="rounded-[18px] border border-[#122033]/8 bg-[#fcfaf6] p-5">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6730]">
                              {categoryLabels.improvements}
                            </h3>
                            <ChangeList items={release.improvements} />
                          </div>
                        )}
                      {release.fixes && release.fixes.length > 0 && (
                        <div className="rounded-[18px] border border-[#122033]/8 bg-[#fcfaf6] p-5">
                          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6730]">
                            {categoryLabels.fixes}
                          </h3>
                          <ChangeList items={release.fixes} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-[18px] border border-[#122033]/8 bg-[#fcfaf6] p-5">
                      <ChangeList items={release.changes} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
