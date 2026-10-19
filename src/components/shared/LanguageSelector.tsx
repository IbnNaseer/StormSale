import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, ChevronDown } from "lucide-react";
import { SUPPORTED_LOCALES, type LocaleMeta, updateDocumentDirection } from "../../lib/i18n";

interface LanguageSelectorProps {
  className?: string;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = "",
  compact = false,
}) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize current locale
  const currentLang = i18n.language ? i18n.language.split("-")[0] : "en";
  const currentLocale: LocaleMeta =
    SUPPORTED_LOCALES.find((l) => l.code === currentLang) || SUPPORTED_LOCALES[0];

  const handleSelectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    updateDocumentDirection(code);
    setIsOpen(false);
  };

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t("header.switchLanguage", "Switch Language")}
        className={`h-10 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition-colors shadow-sm bg-white dark:bg-zinc-900 ${
          compact ? "w-10 px-0" : "px-3"
        }`}
      >
        <span className="text-base leading-none" role="img" aria-label={currentLocale.name}>
          {currentLocale.flag}
        </span>
        {!compact && (
          <>
            <span className="text-xs font-semibold uppercase tracking-wider">
              {currentLocale.code.toUpperCase()}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Select Language"
          className="absolute right-0 mt-2 w-56 max-h-80 overflow-y-auto rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl py-1 z-50 focus:outline-none scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700"
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              {t("header.switchLanguage", "Language")}
            </span>
            <span className="text-[10px] text-zinc-500 font-normal">10 Locales</span>
          </div>

          <div className="py-1">
            {SUPPORTED_LOCALES.map((locale) => {
              const isSelected = locale.code === currentLang;
              return (
                <button
                  key={locale.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectLanguage(locale.code)}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none" role="img" aria-label={locale.name}>
                      {locale.flag}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {locale.nativeName}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-normal">{locale.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {locale.dir === "rtl" && (
                      <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                        RTL
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
