import { createContext, useContext, useState, useEffect } from "react";
import translations from "../i18n/translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("sherlock_lang") || "en";
  });

  useEffect(() => {
    localStorage.setItem("sherlock_lang", lang);
  }, [lang]);

  const t = (key) => {
    return translations[lang]?.[key] ?? translations.en[key] ?? key;
  };

  const tStatus = (prefix, value) => {
    if (!value) return value;
    const key = `${prefix}_${value}`;
    return translations[lang]?.[key] ?? translations.en[key] ?? value;
  };

  // Shared, translated "time ago" formatter — use this everywhere instead of
  // writing a local timeAgo() per file, so it stays in sync across languages.
  const timeAgo = (dateString) => {
    if (!dateString) return "";
    const diffMs = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return t("justNow");
    if (minutes < 60) return `${minutes} ${t("minAgo")}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? t("hrAgo") : t("hrsAgo")}`;
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? t("dayAgo") : t("daysAgo")}`;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tStatus, timeAgo }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside a LanguageProvider");
  }
  return ctx;
}