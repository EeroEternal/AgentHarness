export interface EnvVarConfig {
  keyName: string;
  description: string;
  required: boolean;
}

export interface ProviderKeyConfig {
  provider: string;
  displayName: string;
  envVars: EnvVarConfig[];
}

export interface ExtraEnvVar {
  keyName: string;
  description: string;
  placeholder?: string;
}

export interface ModelProviderConfig {
  id: string;
  name: string;
  envVar: string;
  description: string;
  supportedCLIs: { provider: string; displayName: string }[];
  extraEnvVars?: ExtraEnvVar[];
}

const PROVIDER_KEY_CONFIGS: ProviderKeyConfig[] = [
  {
    provider: "claude",
    displayName: "Claude Code",
    envVars: [
      { keyName: "ANTHROPIC_API_KEY", description: "Anthropic API key for Claude Code", required: true },
    ],
  },
  {
    provider: "codex",
    displayName: "Codex",
    envVars: [
      { keyName: "CODEX_API_KEY", description: "Codex API key", required: true },
      { keyName: "OPENAI_API_KEY", description: "OpenAI API key (fallback)", required: false },
    ],
  },
  {
    provider: "opencode",
    displayName: "OpenCode",
    envVars: [
      { keyName: "ANTHROPIC_API_KEY", description: "Anthropic API key", required: false },
      { keyName: "OPENCODE_API_KEY", description: "OpenCode API key (OpenCode Go/Zen)", required: false },
    ],
  },
  {
    provider: "openclaw",
    displayName: "OpenClaw",
    envVars: [
      { keyName: "ANTHROPIC_API_KEY", description: "Anthropic API key for OpenClaw", required: true },
    ],
  },
  {
    provider: "hermes",
    displayName: "Hermes",
    envVars: [
      { keyName: "ANTHROPIC_API_KEY", description: "Anthropic API key", required: false },
      { keyName: "OPENAI_API_KEY", description: "OpenAI API key", required: false },
    ],
  },
  {
    provider: "kimi",
    displayName: "Kimi",
    envVars: [
      { keyName: "KIMI_API_KEY", description: "Kimi API key", required: true },
    ],
  },
  {
    provider: "trae",
    displayName: "Trae",
    envVars: [
      { keyName: "TRAE_API_KEY", description: "Trae API key", required: true },
    ],
  },
  {
    provider: "claw",
    displayName: "Claw",
    envVars: [
      { keyName: "ANTHROPIC_API_KEY", description: "Anthropic API key for Claw", required: true },
    ],
  },
  {
    provider: "codebuddy",
    displayName: "CodeBuddy",
    envVars: [
      { keyName: "ANTHROPIC_API_KEY", description: "Anthropic API key", required: false },
      { keyName: "OPENAI_API_KEY", description: "OpenAI API key", required: false },
    ],
  },
];

const MODEL_PROVIDER_CONFIGS: ModelProviderConfig[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    envVar: "ANTHROPIC_API_KEY",
    description: "Claude models by Anthropic",
    supportedCLIs: [
      { provider: "claude", displayName: "Claude Code" },
      { provider: "opencode", displayName: "OpenCode" },
      { provider: "claw", displayName: "Claw" },
      { provider: "codebuddy", displayName: "CodeBuddy" },
      { provider: "hermes", displayName: "Hermes" },
    ],
    extraEnvVars: [
      { keyName: "ANTHROPIC_BASE_URL", description: "Custom API base URL", placeholder: "https://api.anthropic.com" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    envVar: "OPENAI_API_KEY",
    description: "GPT models by OpenAI",
    supportedCLIs: [
      { provider: "codex", displayName: "Codex" },
      { provider: "hermes", displayName: "Hermes" },
      { provider: "opencode", displayName: "OpenCode" },
      { provider: "codebuddy", displayName: "CodeBuddy" },
    ],
    extraEnvVars: [
      { keyName: "OPENAI_BASE_URL", description: "Custom API base URL (e.g. Azure endpoint)", placeholder: "https://api.openai.com" },
    ],
  },
  {
    id: "kimi",
    name: "Kimi (Moonshot)",
    envVar: "KIMI_API_KEY",
    description: "Kimi models by Moonshot AI",
    supportedCLIs: [
      { provider: "kimi", displayName: "Kimi" },
      { provider: "codebuddy", displayName: "CodeBuddy" },
    ],
    extraEnvVars: [
      { keyName: "KIMI_BASE_URL", description: "Custom API base URL", placeholder: "https://api.moonshot.cn" },
    ],
  },
  {
    id: "codex",
    name: "Codex",
    envVar: "CODEX_API_KEY",
    description: "Codex CLI by OpenAI",
    supportedCLIs: [
      { provider: "codex", displayName: "Codex" },
    ],
  },
  {
    id: "trae",
    name: "Trae",
    envVar: "TRAE_API_KEY",
    description: "Trae CLI by ByteDance",
    supportedCLIs: [
      { provider: "trae", displayName: "Trae" },
    ],
  },
  {
    id: "opencode",
    name: "OpenCode",
    envVar: "OPENCODE_API_KEY",
    description: "OpenCode Go/Zen models",
    supportedCLIs: [
      { provider: "opencode", displayName: "OpenCode" },
    ],
  },
];

export function getProviderKeyConfig(provider: string): ProviderKeyConfig | undefined {
  return PROVIDER_KEY_CONFIGS.find((p) => p.provider === provider);
}

export function getAllProviderKeyConfigs(): ProviderKeyConfig[] {
  return PROVIDER_KEY_CONFIGS;
}

export function getProviderDisplayName(provider: string): string {
  return getProviderKeyConfig(provider)?.displayName ?? provider;
}

export function getKnownEnvVar(keyName: string): EnvVarConfig | undefined {
  for (const p of PROVIDER_KEY_CONFIGS) {
    const ev = p.envVars.find((e) => e.keyName === keyName);
    if (ev) return ev;
  }
  return undefined;
}

export function getProviderForEnvVar(keyName: string): string | undefined {
  for (const p of PROVIDER_KEY_CONFIGS) {
    if (p.envVars.some((e) => e.keyName === keyName)) return p.provider;
  }
  return undefined;
}

export function getAllKnownEnvVarNames(): string[] {
  const names = new Set<string>();
  for (const p of PROVIDER_KEY_CONFIGS) {
    for (const ev of p.envVars) {
      names.add(ev.keyName);
    }
  }
  return Array.from(names);
}

export function getModelProviders(): ModelProviderConfig[] {
  return MODEL_PROVIDER_CONFIGS;
}

export function getModelProvider(id: string): ModelProviderConfig | undefined {
  return MODEL_PROVIDER_CONFIGS.find((m) => m.id === id);
}
