"use client";

import Link from "next/link";
import { LandingHeader } from "./landing-header";
import { LandingFooter } from "./landing-footer";
import { cn } from "@multica/ui/lib/utils";
import { ArrowRight, Landmark, ShieldCheck, Waypoints } from "lucide-react";
import { GitHubMark, githubUrl } from "./shared";
import { useLocale } from "../i18n";

export function AboutPageClient() {
  const { t, locale } = useLocale();
  const serifClass =
    locale === "zh"
      ? "font-[family:var(--font-serif-zh)]"
      : "font-[family:var(--font-serif)]";
  const pillars = [Landmark, Waypoints, ShieldCheck] as const;
  const labels =
    locale === "zh"
      ? {
          eyebrow: "关于 Harness",
          backHome: "返回首页",
          operatingView: "经营视角",
          operatingViewBody:
            "Harness 建立在一个前提上：一旦 AI 执行进入核心交付，它就必须拥有责任归属、策略约束和复核机制，而不是继续停留在不可见的自动化层。",
          bullets: [
            "跨人工与运行时的可视化执行",
            "带干预点的有边界自治",
            "更清晰的交付决策记录",
          ],
          whyNow: "为什么是现在",
        }
      : {
          eyebrow: "About Harness",
          backHome: "Back to Homepage",
          operatingView: "Operating view",
          operatingViewBody:
            "Harness is built around one assumption: once AI work enters core delivery, it needs ownership, policy, and review instead of invisible execution.",
          bullets: [
            "Visible execution across people and runtimes",
            "Bounded autonomy with intervention points",
            "A cleaner record of delivery decisions",
          ],
          whyNow: "Why now",
        };

  return (
    <>
      <LandingHeader variant="light" />
      <main className="relative overflow-hidden bg-[#f4efe6] text-[#122033]">
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,#f4efe6_0%,#f6f1e7_48%,#f2ebde_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_12%_18%,rgba(181,145,80,0.12),transparent_28%),radial-gradient(circle_at_85%_8%,rgba(18,32,51,0.08),transparent_34%)]" />

        <div className="mx-auto max-w-[1360px] px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="max-w-[820px]">
              <div className="inline-flex items-center rounded-[14px] border border-[#8c6730]/15 bg-white/72 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8c6730]">
                {labels.eyebrow}
              </div>
              <h1 className={cn("mt-6 max-w-[13ch] text-[clamp(3rem,6vw,5.6rem)] leading-[0.94] tracking-[-0.06em] text-[#122033]", serifClass)}>
                {t.about.title}
              </h1>
              <p className="mt-6 max-w-[62ch] text-[1.08rem] leading-8 text-[#122033]/72">
                {t.about.lead}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {/* <Link
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#122033] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a2c46]"
                >
                  <GitHubMark className="size-4" />
                  {t.about.cta}
                </Link> */}
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-[#122033]/12 bg-white/76 px-6 py-3 text-sm font-semibold text-[#122033] transition-colors hover:bg-white"
                >
                  {labels.backHome}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            <aside className="rounded-[28px] border border-[#122033]/10 bg-[#0f1a2c] p-6 text-white shadow-[0_40px_110px_-80px_rgba(8,12,20,0.72)] sm:p-8">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d5b27a]">
                {labels.operatingView}
              </div>
              <div className="mt-4 text-[1.05rem] leading-8 text-white/78">
                {labels.operatingViewBody}
              </div>
              <div className="mt-6 space-y-3">
                {labels.bullets.map((item) => (
                  <div key={item} className="rounded-[16px] border border-white/8 bg-white/6 px-4 py-3 text-sm text-white/72">
                    {item}
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <section className="mt-10 grid gap-4 md:grid-cols-3">
            {t.about.paragraphs.slice(0, 3).map((paragraph, index) => {
              const Icon = pillars[index] ?? ShieldCheck;

              return (
                <article
                  key={paragraph}
                  className="rounded-[22px] border border-[#122033]/10 bg-white/82 p-6 shadow-[0_24px_80px_-70px_rgba(18,32,51,0.5)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex size-11 items-center justify-center rounded-[16px] bg-[#122033] text-white">
                      <Icon className="size-5" />
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#122033]/34">
                      0{index + 1}
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-[#122033]/68">{paragraph}</p>
                </article>
              );
            })}
          </section>

          <section className="mt-10 overflow-hidden rounded-[30px] border border-[#122033]/10 bg-[#fcfaf6] shadow-[0_30px_100px_-82px_rgba(18,32,51,0.46)]">
            <div className="grid gap-0 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div className="border-b border-[#122033]/8 px-6 py-6 lg:border-b-0 lg:border-r lg:px-8 lg:py-8">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6730]">
                  {labels.whyNow}
                </div>
              </div>
              <div className="divide-y divide-[#122033]/8">
                {t.about.paragraphs.slice(3).map((paragraph) => (
                  <div key={paragraph} className="px-6 py-6 text-[15px] leading-8 text-[#122033]/72 lg:px-8">
                    {paragraph}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
