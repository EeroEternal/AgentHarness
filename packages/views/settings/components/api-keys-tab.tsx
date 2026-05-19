"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, Save, ChevronDown, Search, Eye, EyeOff } from "lucide-react";
import { Button } from "@multica/ui/components/ui/button";
import { Input } from "@multica/ui/components/ui/input";
import { toast } from "sonner";
import { api } from "@multica/core/api";
import { useWorkspaceStore } from "@multica/core/workspace";
import { useTranslation } from "@multica/core";
import { getModelProviders, getModelProvider } from "@multica/core/api/provider-keys";
import { ProviderLogo } from "../../runtimes/components/provider-logo";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@multica/ui/components/ui/popover";
import { cn } from "@multica/ui/lib/utils";

interface ApiKeyEntry {
  key_name: string;
  value: string;
  masked_value?: string;
}

export function ApiKeysTab() {
  const { t } = useTranslation();
  const workspaceId = useWorkspaceStore((s) => s.workspace?.id);

  const modelProviders = useMemo(() => getModelProviders(), []);

  const [saving, setSaving] = useState(false);
  const [keys, setKeys] = useState<Map<string, ApiKeyEntry>>(new Map());
  const [loading, setLoading] = useState(true);
  const [providerOpen, setProviderOpen] = useState(false);
  const [providerSearch, setProviderSearch] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    api.getWorkspaceApiKeys(workspaceId)
      .then((data) => {
        const map = new Map<string, ApiKeyEntry>();
        for (const k of data as { key_name: string; masked_value: string }[]) {
          map.set(k.key_name, { key_name: k.key_name, value: "", masked_value: k.masked_value });
        }
        setKeys(map);
      })
      .catch(() => toast.error(t("apiKeys.failedToLoad", "Failed to load API keys")))
      .finally(() => setLoading(false));
  }, [workspaceId, t]);

  const filteredProviders = useMemo(() => {
    if (!providerSearch) return modelProviders;
    const q = providerSearch.toLowerCase();
    return modelProviders.filter(
      (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
    );
  }, [modelProviders, providerSearch]);

  const selectedModelProvider = selectedProvider ? getModelProvider(selectedProvider) : null;
  const entry = selectedModelProvider ? keys.get(selectedModelProvider.envVar) : null;
  const [inputValue, setInputValue] = useState("");
  const [visible, setVisible] = useState(false);
  const [extraValues, setExtraValues] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (entry) {
      setInputValue(entry.value || entry.masked_value || "");
    } else if (selectedModelProvider) {
      setInputValue("");
    }
  }, [selectedModelProvider, entry]);

  useEffect(() => {
    if (selectedModelProvider?.extraEnvVars) {
      const init: Record<string, string> = {};
      for (const ev of selectedModelProvider.extraEnvVars) {
        const k = keys.get(ev.keyName);
        init[ev.keyName] = k?.value || k?.masked_value || "";
      }
      setExtraValues(init);
    } else {
      setExtraValues({});
    }
  }, [selectedModelProvider, keys]);

  const configuredProviders = modelProviders.filter((m) => {
    const e = keys.get(m.envVar);
    return e && (e.value || e.masked_value);
  });

  const handleSave = async () => {
    if (!workspaceId || !selectedModelProvider) return;
    setSaving(true);
    try {
      const keyMap: Record<string, string> = {};
      if (inputValue) {
        keyMap[selectedModelProvider.envVar] = inputValue;
      }
      for (const ev of selectedModelProvider.extraEnvVars ?? []) {
        const val = extraValues[ev.keyName];
        if (val) {
          keyMap[ev.keyName] = val;
        }
      }
      await api.putWorkspaceApiKeys(workspaceId, keyMap);
      const updated = new Map(keys);
      const setKey = (name: string, val: string) => {
        updated.set(name, { key_name: name, value: "", masked_value: val });
      };
      if (inputValue) setKey(selectedModelProvider.envVar, inputValue);
      for (const ev of selectedModelProvider.extraEnvVars ?? []) {
        const val = extraValues[ev.keyName];
        if (val) setKey(ev.keyName, val);
      }
      setKeys(updated);
      toast.success(t("apiKeys.saved", "API key saved"));
    } catch {
      toast.error(t("apiKeys.failedToSave", "Failed to save API key"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Configured providers summary */}
      {configuredProviders.length > 0 && (
        <div className="rounded-xl border bg-background overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/20">
            <h4 className="text-sm font-semibold">{t("apiKeys.configuredKeys", "Configured API Keys")}</h4>
          </div>
          <div className="divide-y">
            {configuredProviders.map((mp) => {
              const e = keys.get(mp.envVar);
              return (
                <div key={mp.id} className="flex items-center gap-3 px-4 py-3">
                  <ProviderLogo provider={mp.supportedCLIs[0]?.provider ?? ""} className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium min-w-0 flex-1">{mp.name}</span>
                  <code className="text-xs text-muted-foreground">{mp.envVar}</code>
                  <code className="text-xs font-mono text-muted-foreground">
                    {e?.masked_value ? maskValue(e.masked_value) : ""}
                  </code>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Provider selector */}
      <div className="rounded-xl border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/20">
          <h4 className="text-sm font-semibold">{t("apiKeys.selectProvider", "Select Model Provider")}</h4>
        </div>
        <div className="p-4 space-y-4">
          <Popover open={providerOpen} onOpenChange={setProviderOpen}>
            <PopoverTrigger className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-4 text-left text-sm transition-colors hover:bg-muted/30 cursor-pointer">
              {selectedModelProvider ? (
                <>
                  <ProviderLogo provider={selectedModelProvider.supportedCLIs[0]?.provider ?? ""} className="h-5 w-5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold">{selectedModelProvider.name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedModelProvider.description}</p>
                  </div>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t("apiKeys.searchProvider", "Search model provider...")}
                </span>
              )}
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", providerOpen && "rotate-180")} />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--anchor-width)] p-2 max-h-72 overflow-y-auto">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("apiKeys.searchPlaceholder", "Search providers...")}
                  value={providerSearch}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  className="pl-9 text-xs"
                  autoFocus
                />
              </div>
              {filteredProviders.map((mp) => {
                const configured = keys.has(mp.envVar);
                return (
                  <button
                    key={mp.id}
                    onClick={() => {
                      setSelectedProvider(mp.id);
                      setProviderOpen(false);
                      setProviderSearch("");
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors mb-1 cursor-pointer",
                      mp.id === selectedProvider
                        ? "bg-primary/5 border border-primary/20"
                        : "hover:bg-muted/50 border border-transparent"
                    )}
                  >
                    <ProviderLogo provider={mp.supportedCLIs[0]?.provider ?? ""} className="h-5 w-5" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold">{mp.name}</span>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{mp.description}</p>
                    </div>
                    <code className="text-xs text-muted-foreground shrink-0">{mp.envVar}</code>
                    {configured && (
                      <span className="shrink-0 rounded bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success">
                        {t("apiKeys.configured", "Configured")}
                      </span>
                    )}
                  </button>
                );
              })}
              {filteredProviders.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {t("apiKeys.noProviders", "No matching providers")}
                </p>
              )}
            </PopoverContent>
          </Popover>

          {selectedModelProvider && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedModelProvider.supportedCLIs.map((cli) => (
                  <div key={cli.provider} className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5">
                    <ProviderLogo provider={cli.provider} className="h-4 w-4" />
                    <span className="text-xs font-medium">{cli.displayName}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <code className="text-xs font-semibold">{selectedModelProvider.envVar}</code>
                </div>
                <div className="relative">
                  <Input
                    type={visible ? "text" : "password"}
                    placeholder={`sk-...`}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="pr-9 font-mono text-xs"
                  />
                  {inputValue && (
                    <button
                      type="button"
                      onClick={() => setVisible(!visible)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {selectedModelProvider.extraEnvVars && selectedModelProvider.extraEnvVars.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("apiKeys.extraSettings", "Additional Settings")}
                  </p>
                  {selectedModelProvider.extraEnvVars.map((ev) => (
                    <div key={ev.keyName} className="space-y-1.5">
                      <code className="text-xs font-semibold">{ev.keyName}</code>
                      <Input
                        type="text"
                        placeholder={ev.placeholder ?? ""}
                        value={extraValues[ev.keyName] ?? ""}
                        onChange={(e) => setExtraValues((prev) => ({ ...prev, [ev.keyName]: e.target.value }))}
                        className="font-mono text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4" />
                  {t("common.save", "Save")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function maskValue(v: string): string {
  if (v.length <= 8) return "****";
  return v.slice(0, 4) + "****" + v.slice(-4);
}
