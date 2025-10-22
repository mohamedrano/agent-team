"use client";
import i18n from "i18next";

export default function LanguageSwitcher() {
  return (
    <div data-testid="language-switcher" className="flex items-center gap-2">
      <button
        data-testid="lang-ar"
        onClick={() => i18n.changeLanguage("ar")}
        className="underline"
      >
        العربية
      </button>
      <span aria-hidden="true">|</span>
      <button
        data-testid="lang-en"
        onClick={() => i18n.changeLanguage("en")}
        className="underline"
      >
        English
      </button>
    </div>
  );
}
