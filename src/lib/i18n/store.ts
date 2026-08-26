"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Language, languages, translations, type TranslationKey } from "./translations";

interface I18nState {
  language: Language;
  dir: "ltr" | "rtl";
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      language: "da",
      dir: "rtl",
      setLanguage: (lang) => {
        const langInfo = languages.find((l) => l.code === lang);
        set({ language: lang, dir: langInfo?.dir ?? "ltr" });
      },
      t: (key) => {
        const lang = get().language;
        return translations[lang][key] ?? translations.en[key] ?? key;
      },
    }),
    {
      name: "gas-station-i18n",
    }
  )
);
