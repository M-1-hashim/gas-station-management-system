"use client";

import { useI18n } from "@/lib/i18n/store";
import { formatCurrency as fmtCurrency } from "@/lib/format";

// Hook to access translation function, language, and direction
export function useLanguage() {
  const language = useI18n((s) => s.language);
  const dir = useI18n((s) => s.dir);
  const setLanguage = useI18n((s) => s.setLanguage);
  const t = useI18n((s) => s.t);
  return { language, dir, setLanguage, t };
}

// Hook for currency formatting
export function useCurrency() {
  return { format: (amount: number, symbol?: string) => fmtCurrency(amount, symbol) };
}
