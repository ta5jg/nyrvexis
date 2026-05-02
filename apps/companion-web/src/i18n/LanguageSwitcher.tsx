import React from "react";
import { SUPPORTED_LOCALES, useTranslation } from "./index";

export function LanguageSwitcher() {
  const { t, locale, setLocale } = useTranslation();
  return (
    <label className="i18nSwitcher">
      <span className="i18nSwitcherLabel">{t("language.label")}</span>
      <select
        className="i18nSwitcherSelect"
        value={locale}
        onChange={(e) => setLocale(e.target.value as (typeof SUPPORTED_LOCALES)[number])}
        aria-label={t("language.label")}
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {t(`language.${code}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
