"use client";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ar from "@/i18n/ar/common.json";
import en from "@/i18n/en/common.json";

let inited = false;
export function initI18nOnce() {
  if (inited) return i18n;
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: { ar: { common: ar }, en: { common: en } },
      fallbackLng: "ar",
      defaultNS: "common",
      interpolation: { escapeValue: false },
      detection: { order: ["querystring", "cookie", "localStorage", "navigator"] },
    });
  inited = true;
  setHtmlDirLang(i18n.language || "ar");
  return i18n;
}

export function setHtmlDirLang(lang: string) {
  const dir = lang.startsWith("ar") ? "rtl" : "ltr";
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", dir);
  }
}
