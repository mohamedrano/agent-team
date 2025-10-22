"use client";
import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { initI18nOnce, setHtmlDirLang } from "@/lib/i18n/runtime";
import i18n from "i18next";

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  initI18nOnce();
  useEffect(() => {
    const handler = () => setHtmlDirLang(i18n.language || "ar");
    handler();
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
