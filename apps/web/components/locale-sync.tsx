"use client";

import { useEffect } from "react";
import { useI18nStore } from "@agentharness/core";

/**
 * Reads the locale cookie on the client and updates <html lang> and i18n store.
 * This avoids calling cookies() in the root Server Component layout,
 * which would mark the entire app as dynamic and disable the Router Cache.
 */
export function LocaleSync() {
  const initializeFromCookie = useI18nStore((state) => state.initializeFromCookie);

  useEffect(() => {
    initializeFromCookie();
  }, [initializeFromCookie]);

  return null;
}
