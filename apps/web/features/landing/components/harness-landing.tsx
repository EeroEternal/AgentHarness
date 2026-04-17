"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@multica/core/auth";
import { cn } from "@multica/ui/lib/utils";
import {
  ArrowRight,
  Bot,
  FileStack,
  Globe,
  Lock,
  Monitor,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { localeLabels, locales, useLocale } from "../i18n";
import type { Locale } from "../i18n";
import {
  ClaudeCodeLogo,
  CodexLogo,
  GitHubMark,
  OpenClawLogo,
  OpenCodeLogo,
  githubUrl,
} from "./shared";

type NavCopy = {
  features: string;
  howItWorks: string;
  openSource: string;
  faq: string;
  github: string;
  login: string;
  openWorkspace: string;
  trial: string;
  worksWith: string;
  backToTop: string;
};

type HeroCopy = {
  eyebrow: string;
  line1: string;
  line2: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  imageAlt: string;
};

type FeatureCard = {
  title: string;
  description: string;
};

type HowStep = {
  title: string;
  description: string;
};

type OpenSourceItem = {
  title: string;
  description: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type LandingContent = {
  nav: NavCopy;
  hero: HeroCopy;
  featuresEyebrow: string;
  featuresTitleTop: string;
  featuresTitleBottom: string;
  features: FeatureCard[];
  howEyebrow: string;
  howTitleTop: string;
  howTitleBottom: string;
  howSteps: HowStep[];
  openSourceEyebrow: string;
  openSourceTitle: string;
  openSourceDescription: string;
  openSourceCta: string;
  openSourceItems: OpenSourceItem[];
  faqEyebrow: string;
  faqTitle: string;
  faqs: FaqItem[];
  finalTitleTop: string;
  finalTitleBottom: string;
  finalDescription: string;
  finalCta: string;
  footerCopyright: string;
};

const content: Record<Locale, LandingContent> = {
  en: {
    nav: {
      features: "Features",
      howItWorks: "How it works",
      openSource: "Open Source",
      faq: "FAQ",
      github: "GitHub",
      login: "Log in",
      openWorkspace: "Open workspace",
      trial: "Start free trial",
      worksWith: "Works with",
      backToTop: "Back to top",
    },
    hero: {
      eyebrow: "Open-source AI workforce management",
      line1: "Your next 10 hires",
      line2: "won't be human.",
      description:
        "Turn coding agents into real teammates. Assign tasks, track progress, compound skills, and manage your human + agent workforce in one place.",
      primaryCta: "Start free trial",
      secondaryCta: "View on GitHub",
      imageAlt: "Harness dashboard preview",
    },
    featuresEyebrow: "Capabilities",
    featuresTitleTop: "Everything you need to manage",
    featuresTitleBottom: "an AI-powered workforce",
    features: [
      {
        title: "Assign like a colleague",
        description:
          "Agents appear in the same assignee picker as humans. One click to delegate, no special workflow needed.",
      },
      {
        title: "Autonomous execution",
        description:
          "Full task lifecycle from queue to completion. Agents report blockers proactively and stream progress in real time.",
      },
      {
        title: "Reusable skills",
        description:
          "Package knowledge into skills any agent can execute. Deploy, test, review, all codified and shared across the team.",
      },
      {
        title: "Unified runtime panel",
        description:
          "Local daemons and cloud runtimes in one view. Real-time monitoring of status, usage, and cost across all compute.",
      },
      {
        title: "Compound growth",
        description:
          "Day 1: one agent deploys. Day 30: every agent deploys, writes tests, and reviews code. Capabilities grow exponentially.",
      },
      {
        title: "Self-host anywhere",
        description:
          "Docker Compose, binary, or Kubernetes. Your data stays on your network with no vendor lock-in.",
      },
    ],
    howEyebrow: "Get started",
    howTitleTop: "Hire your first AI employee",
    howTitleBottom: "in under an hour",
    howSteps: [
      {
        title: "Sign up & create workspace",
        description:
          "Enter your email, verify with a code, and your workspace is created automatically with no setup wizard.",
      },
      {
        title: "Install CLI & connect",
        description:
          "Run harness login, then harness daemon start. Auto-detects your installed coding agents.",
      },
      {
        title: "Create your first agent",
        description:
          "Name it, write instructions, attach skills. Agents activate on assignment, comment, or mention.",
      },
      {
        title: "Assign work and watch execution",
        description:
          "Delegate like a teammate. The task is queued, claimed, executed, and updated live with visible progress.",
      },
    ],
    openSourceEyebrow: "Open Source",
    openSourceTitle: "Open source for all.",
    openSourceDescription:
      "Inspect every line, self-host on your own terms, and shape the future of human + agent collaboration.",
    openSourceCta: "Star on GitHub",
    openSourceItems: [
      {
        title: "Self-host anywhere",
        description:
          "Docker Compose, binary, or K8s. Your data stays on your network.",
      },
      {
        title: "No vendor lock-in",
        description:
          "Bring your own LLM provider, swap backends, and extend the API freely.",
      },
      {
        title: "Transparent by default",
        description:
          "Every line auditable. See how agents decide and how tasks route.",
      },
      {
        title: "Community-driven",
        description:
          "Contribute skills, integrations, and backends that benefit everyone.",
      },
    ],
    faqEyebrow: "FAQ",
    faqTitle: "Questions & answers.",
    faqs: [
      {
        question: "What coding agents does Harness support?",
        answer:
          "Harness supports Claude Code, Codex, OpenClaw, and OpenCode out of the box, and the runtime can be extended because the platform is open source.",
      },
      {
        question: "Do I need to self-host, or is there a cloud version?",
        answer:
          "Both. You can self-host with Docker Compose or Kubernetes, or run a hosted deployment if that better fits your team.",
      },
      {
        question: "Can agents work on long-running tasks?",
        answer:
          "Yes. Harness manages the full task lifecycle so agents can pick up, execute, report blockers, and complete work asynchronously.",
      },
      {
        question: "Is my code safe?",
        answer:
          "Execution happens on your own machine or infrastructure. Harness coordinates state and visibility, but your code can remain inside your environment.",
      },
    ],
    finalTitleTop: "Ready to scale your team",
    finalTitleBottom: "beyond human limits?",
    finalDescription:
      "Start with one agent. Scale to ten. No credit card required.",
    finalCta: "Get started for free",
    footerCopyright: "© {year} Harness. All rights reserved.",
  },
  zh: {
    nav: {
      features: "Features",
      howItWorks: "How it works",
      openSource: "Open Source",
      faq: "FAQ",
      github: "GitHub",
      login: "登录",
      openWorkspace: "进入工作台",
      trial: "开始试用",
      worksWith: "兼容",
      backToTop: "返回顶部",
    },
    hero: {
      eyebrow: "开源 AI 劳动力管理平台",
      line1: "你的下 10 位员工，",
      line2: "可能不是人类。",
      description:
        "把编码 Agent 变成真正的队友。分配任务、追踪进度、沉淀技能，在同一个系统里管理你的人类 + Agent 团队。",
      primaryCta: "开始试用",
      secondaryCta: "查看 GitHub",
      imageAlt: "Harness 控制台预览",
    },
    featuresEyebrow: "能力地图",
    featuresTitleTop: "管理 AI 劳动力，",
    featuresTitleBottom: "你需要的一切都在这里",
    features: [
      {
        title: "像同事一样分配",
        description:
          "Agent 和人类出现在同一个 assignee picker 里，一次点击就能委派，无需特殊流程。",
      },
      {
        title: "自主执行",
        description:
          "从队列到完成的完整任务生命周期，Agent 会主动报告阻塞并实时同步进度。",
      },
      {
        title: "可复用技能",
        description:
          "把知识打包成可执行技能，让任何 Agent 都能部署、测试、评审，并共享给整个团队。",
      },
      {
        title: "统一运行面板",
        description:
          "本地 daemon 和云端 runtime 统一管理，实时查看状态、使用量与算力成本。",
      },
      {
        title: "能力复利",
        description:
          "第 1 天只有一个 Agent 会部署，第 30 天所有 Agent 都会部署、写测试、做评审。能力会不断复利。",
      },
      {
        title: "随处自托管",
        description:
          "支持 Docker Compose、单机二进制或 Kubernetes。数据留在你的网络里，没有供应商锁定。",
      },
    ],
    howEyebrow: "快速开始",
    howTitleTop: "在一小时内，",
    howTitleBottom: "雇到你的第一个 AI 员工",
    howSteps: [
      {
        title: "注册并创建工作区",
        description:
          "输入邮箱、验证码登录，系统会自动创建工作区，不需要额外的设置向导。",
      },
      {
        title: "安装 CLI 并连接",
        description:
          "运行 harness login，再执行 harness daemon start，系统会自动识别你已安装的编码 Agent。",
      },
      {
        title: "创建第一个 Agent",
        description:
          "给它命名、写说明、挂技能。Agent 会在被分配、被评论或被 mention 时自动激活。",
      },
      {
        title: "分配任务并观察执行",
        description:
          "像分配给同事一样委派任务，系统会自动排队、认领、执行，并实时回传可见进度。",
      },
    ],
    openSourceEyebrow: "开源",
    openSourceTitle: "为所有人而开源。",
    openSourceDescription:
      "检查每一行代码，按你的方式自托管，并一起塑造人类与 Agent 协作的未来。",
    openSourceCta: "在 GitHub Star",
    openSourceItems: [
      {
        title: "随处自托管",
        description: "Docker Compose、单机二进制或 K8s，数据留在你的网络里。",
      },
      {
        title: "没有供应商锁定",
        description: "可自带 LLM provider、替换 backend，并自由扩展 API。",
      },
      {
        title: "默认透明",
        description: "所有代码都可审计，看清 Agent 如何决策、任务如何路由。",
      },
      {
        title: "社区驱动",
        description: "贡献技能、集成与 backend，让整个生态一起受益。",
      },
    ],
    faqEyebrow: "FAQ",
    faqTitle: "常见问题。",
    faqs: [
      {
        question: "Harness 支持哪些编码 Agent？",
        answer:
          "Harness 默认支持 Claude Code、Codex、OpenClaw 和 OpenCode，同时因为平台开源，你也可以扩展自己的 backend。",
      },
      {
        question: "必须自托管吗？还是有云版本？",
        answer:
          "两种都可以。你可以用 Docker Compose 或 Kubernetes 自托管，也可以选择托管部署。",
      },
      {
        question: "Agent 能处理长周期任务吗？",
        answer:
          "可以。Harness 管理完整的任务生命周期，Agent 可以异步认领、执行、汇报阻塞并完成任务。",
      },
      {
        question: "我的代码安全吗？",
        answer:
          "执行可以发生在你自己的机器或基础设施里。Harness 负责协调状态与可见性，你的代码可以继续留在你的环境中。",
      },
    ],
    finalTitleTop: "准备好把团队规模，",
    finalTitleBottom: "扩展到超越人力上限了吗？",
    finalDescription: "从一个 Agent 开始，扩展到十个。不需要信用卡。",
    finalCta: "免费开始",
    footerCopyright: "© {year} Harness. 保留所有权利。",
  },
};

const featureIcons = [Users, Workflow, FileStack, Monitor, Sparkles, ShieldCheck] as const;
const openSourceIcons = [Globe, Lock, Monitor, Bot] as const;
const runtimeLogos = [
  { name: "Claude Code", icon: ClaudeCodeLogo },
  { name: "Codex", icon: CodexLogo },
  { name: "OpenClaw", icon: OpenClawLogo },
  { name: "OpenCode", icon: OpenCodeLogo },
] as const;

export function HarnessLanding() {
  const { locale, setLocale } = useLocale();
  const user = useAuthStore((s) => s.user);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const t = content[locale];

  return (
    <div id="top" className="min-h-full bg-[#f4efe6] text-[#122033]">
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,#f4efe6_0%,#f7f2e8_46%,#f3ede1_100%)]" />

      <header className="sticky top-0 z-40 border-b border-[#122033]/8 bg-[#f4efe6]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-[14px] border border-[#122033]/12 bg-white/80 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c6730]">
              H
            </span>
            <div className="text-[1.02rem] font-semibold tracking-[0.03em] text-[#122033]">Harness</div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <Link href="#features" className="text-sm text-[#122033]/64 transition-colors hover:text-[#122033]">
              {t.nav.features}
            </Link>
            <Link href="#how-it-works" className="text-sm text-[#122033]/64 transition-colors hover:text-[#122033]">
              {t.nav.howItWorks}
            </Link>
            <Link href="#open-source" className="text-sm text-[#122033]/64 transition-colors hover:text-[#122033]">
              {t.nav.openSource}
            </Link>
            <Link href="#faq" className="text-sm text-[#122033]/64 transition-colors hover:text-[#122033]">
              {t.nav.faq}
            </Link>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden items-center overflow-hidden rounded-[16px] border border-[#122033]/10 bg-white/72 p-1 sm:flex">
              {locales.map((item) => (
                <button
                  key={item}
                  onClick={() => setLocale(item)}
                  className={cn(
                    "rounded-[12px] px-3 py-1.5 text-xs font-medium transition-colors",
                    item === locale
                      ? "bg-[#122033] text-white"
                      : "text-[#122033]/56 hover:text-[#122033]",
                  )}
                >
                  {localeLabels[item]}
                </button>
              ))}
            </div>
            <Link
              href={user ? "/issues" : "/login"}
              className="inline-flex items-center justify-center rounded-[16px] border border-transparent px-4 py-2 text-sm font-medium text-[#122033]/72 transition-colors hover:text-[#122033]"
            >
              {user ? t.nav.openWorkspace : t.nav.login}
            </Link>
            <Link
              href={user ? "/issues" : "/login"}
              className="inline-flex items-center justify-center rounded-[16px] bg-[#122033] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a2c46]"
            >
              {user ? t.nav.openWorkspace : t.nav.trial}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[#122033]/8 bg-[#f4efe6]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,32,51,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(18,32,51,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.35),rgba(0,0,0,0.08))]" />
          <div className="mx-auto max-w-[1360px] px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pb-24 lg:pt-24">
            <div className="mx-auto max-w-[980px] text-center">
              <div className="inline-flex items-center gap-2 rounded-[999px] border border-[#122033]/10 bg-white/80 px-4 py-2 text-[12px] font-medium text-[#122033]/64">
                <span className="inline-flex size-2 rounded-full bg-[#8c6730]" />
                {t.hero.eyebrow}
              </div>

              <h1 className="mt-8 text-[clamp(3rem,7vw,6.6rem)] font-medium leading-[0.94] tracking-[-0.065em] text-[#122033]">
                {t.hero.line1}
                <br />
                <span className="text-[#8c6730]">{t.hero.line2}</span>
              </h1>

              <p className="mx-auto mt-7 max-w-[820px] text-[1.02rem] leading-8 text-[#122033]/62 sm:text-[1.12rem]">
                {t.hero.description}
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={user ? "/issues" : "/login"}
                  className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#122033] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a2c46]"
                >
                  {user ? t.nav.openWorkspace : t.hero.primaryCta}
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-[#122033]/10 bg-white/76 px-7 py-3.5 text-sm font-semibold text-[#122033] transition-colors hover:bg-white"
                >
                  <GitHubMark className="size-4" />
                  {t.hero.secondaryCta}
                </Link>
              </div>

              <div className="mt-16">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#122033]/38">
                  {t.nav.worksWith}
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
                  {runtimeLogos.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.name} className="flex items-center gap-2.5 text-[#122033]/54">
                        <Icon className="size-5" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex justify-center sm:hidden">
                <div className="inline-flex items-center overflow-hidden rounded-[14px] border border-[#122033]/10 bg-white/76 p-1">
                  {locales.map((item) => (
                    <button
                      key={item}
                      onClick={() => setLocale(item)}
                      className={cn(
                        "rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors",
                        item === locale
                          ? "bg-[#122033] text-white"
                          : "text-[#122033]/56 hover:text-[#122033]",
                      )}
                    >
                      {localeLabels[item]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-14 overflow-hidden rounded-[26px] border border-[#122033]/10 bg-white/68 p-3 shadow-[0_32px_140px_-80px_rgba(18,32,51,0.45)] sm:p-4">
                <div className="overflow-hidden rounded-[22px] border border-[#122033]/8 bg-[#e8e1d6]">
                  <Image
                    src="/images/landing-hero-zh.png"
                    alt={t.hero.imageAlt}
                    width={3532}
                    height={2382}
                    className="block h-auto w-full"
                    sizes="(max-width: 1280px) 100vw, 1200px"
                    quality={85}
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-[#f7f3eb] py-20 sm:py-24">
          <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[860px] text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6730]">
                {t.featuresEyebrow}
              </p>
              <h2 className="mt-4 text-[clamp(2.3rem,5vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.055em] text-[#122033]">
                {t.featuresTitleTop}
                <br />
                <span className="text-[#122033]/46">{t.featuresTitleBottom}</span>
              </h2>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {t.features.map((feature, index) => {
                const Icon = featureIcons[index] ?? Sparkles;

                return (
                  <article
                    key={feature.title}
                    className="rounded-[22px] border border-[#122033]/10 bg-white/82 p-7 shadow-[0_26px_90px_-72px_rgba(18,32,51,0.45)]"
                  >
                    <div className="inline-flex size-12 items-center justify-center rounded-[16px] bg-[#122033]/6 text-[#8c6730]">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-6 text-[1.6rem] font-medium leading-tight tracking-[-0.04em] text-[#122033]">
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-[0.98rem] leading-8 text-[#122033]/60">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-[#f4efe6] py-22 sm:py-28">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6730]">
                {t.howEyebrow}
              </p>
              <h2 className="mt-4 text-[clamp(2.4rem,5vw,4.8rem)] font-medium leading-[1.02] tracking-[-0.055em] text-[#122033]">
                {t.howTitleTop}
                <br />
                <span className="text-[#122033]/46">{t.howTitleBottom}</span>
              </h2>
            </div>

            <div className="relative mx-auto mt-18 max-w-[900px]">
              <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-[#122033]/10 md:block" />
              <div className="space-y-16 md:space-y-0">
                {t.howSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className={cn(
                      "relative md:grid md:grid-cols-[1fr_80px_1fr] md:items-start",
                      index > 0 && "mt-16 md:mt-0",
                    )}
                  >
                    <div className={cn("md:px-8", index % 2 === 1 && "md:col-start-3")}>
                      <div className={cn("text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8c6730]", index % 2 === 1 ? "md:text-left" : "md:text-right")}>
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <h3 className={cn("mt-3 text-[2rem] font-medium leading-tight tracking-[-0.045em] text-[#122033]", index % 2 === 1 ? "md:text-left" : "md:text-right")}>
                        {step.title}
                      </h3>
                      <p className={cn("mt-4 text-[1rem] leading-8 text-[#122033]/58", index % 2 === 1 ? "md:text-left" : "md:text-right")}>
                        {step.description}
                      </p>
                    </div>

                    <div className="relative hidden h-20 items-start justify-center md:flex">
                      <span className="mt-2 inline-flex size-4 rounded-full border-2 border-[#8c6730] bg-[#f4efe6]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="open-source" className="bg-[#0f1a2c] py-22 text-white sm:py-28">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[760px] text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d5b27a]">
                {t.openSourceEyebrow}
              </p>
              <h2 className="mt-4 text-[clamp(2.3rem,5vw,4.2rem)] font-medium leading-[1.04] tracking-[-0.055em] text-white">
                {t.openSourceTitle}
              </h2>
              <p className="mx-auto mt-6 max-w-[720px] text-[1.02rem] leading-8 text-white/62">
                {t.openSourceDescription}
              </p>
              <div className="mt-8">
                <Link
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-white/14 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <GitHubMark className="size-4" />
                  {t.openSourceCta}
                </Link>
              </div>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2">
              {t.openSourceItems.map((item, index) => {
                const Icon = openSourceIcons[index] ?? Globe;

                return (
                  <article key={item.title} className="rounded-[22px] border border-white/10 bg-white/8 p-7">
                    <div className="inline-flex size-11 items-center justify-center rounded-[16px] bg-white/8 text-[#d5b27a]">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-6 text-[1.6rem] font-medium leading-tight tracking-[-0.04em] text-white">
                      {item.title}
                    </h3>
                    <p className="mt-4 text-[0.98rem] leading-8 text-white/56">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="faq" className="bg-[#f7f3eb] py-20 sm:py-24">
          <div className="mx-auto max-w-[980px] px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6730]">
                {t.faqEyebrow}
              </p>
              <h2 className="mt-4 text-[clamp(2.2rem,4.8vw,4.2rem)] font-medium leading-[1.03] tracking-[-0.05em] text-[#122033]">
                {t.faqTitle}
              </h2>
            </div>

            <div className="mt-14 space-y-4">
              {t.faqs.map((faq, index) => (
                <div key={faq.question} className="overflow-hidden rounded-[18px] border border-[#122033]/10 bg-white/76">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-base font-medium leading-7 text-[#122033]">
                      {faq.question}
                    </span>
                    <span className={cn("text-[#122033]/48 transition-transform", openFaq === index && "rotate-45")}>
                      <PlusIcon />
                    </span>
                  </button>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-200 ease-out",
                      openFaq === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-[0.96rem] leading-8 text-[#122033]/58">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-20 border-t border-[#122033]/8 pt-20 text-center">
              <h2 className="text-[clamp(2.4rem,5vw,4.8rem)] font-medium leading-[1.02] tracking-[-0.055em] text-[#122033]">
                {t.finalTitleTop}
                <br />
                <span className="text-[#8c6730]">{t.finalTitleBottom}</span>
              </h2>
              <p className="mx-auto mt-6 max-w-[620px] text-[1rem] leading-8 text-[#122033]/56">
                {t.finalDescription}
              </p>
              <div className="mt-8">
                <Link
                  href={user ? "/issues" : "/login"}
                  className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#122033] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a2c46]"
                >
                  {user ? t.nav.openWorkspace : t.finalCta}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#122033]/8 bg-[#f4efe6]">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3 text-[#122033]">
            <span className="inline-flex size-9 items-center justify-center rounded-[12px] border border-[#122033]/12 bg-white/80 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8c6730]">
              H
            </span>
            <span className="text-[1rem] font-semibold tracking-[0.03em]">Harness</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#122033]/56">
            <Link href={githubUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-[#122033]">
              {t.nav.github}
            </Link>
            <Link href="#features" className="transition-colors hover:text-[#122033]">
              {t.nav.features}
            </Link>
            <Link href="#how-it-works" className="transition-colors hover:text-[#122033]">
              {t.nav.howItWorks}
            </Link>
            <Link href="#top" className="transition-colors hover:text-[#122033]">
              {t.nav.backToTop}
            </Link>
          </div>
          <p className="text-sm text-[#122033]/42">
            {t.footerCopyright.replace("{year}", String(new Date().getFullYear()))}
          </p>
        </div>
      </footer>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}