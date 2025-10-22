"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { applyDirection } from "@/lib/rtl";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (i18n?.language) {
      applyDirection(i18n.language);
    }
  }, [i18n?.language]);

  const toggleLanguage = () => {
    const currentLang = i18n?.language || "en";
    const newLang = currentLang === "en" ? "ar" : "en";
    i18n?.changeLanguage(newLang);
    applyDirection(newLang);
  };

  if (!mounted) return null;

  return (
    <Button variant="ghost" size="sm" onClick={toggleLanguage}>
      {(i18n?.language || "en") === "en" ? "العربية" : "English"}
    </Button>
  );
}
