import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, ChevronDown } from "lucide-react";
import { SUPPORTED_LOCALES, type LocaleMeta, updateDocumentDirection } from "../../lib/i18n";

/**
 * Props for the LanguageSelector component.
 */
export interface LanguageSelectorProps {
  /** Optional custom CSS classes for positioning and spacing */
  className?: string;
  /** Whether to render in compact icon-only mode for mobile headers or tight toolbars */
  compact?: boolean;
}

/**
 * LanguageSelector component providing instantaneous locale switching across 10 supported languages.
 * Implements the W3C ARIA Listbox pattern with comprehensive keyboard navigation
 * (ArrowDown, ArrowUp, Home, End, Escape, Enter, Space) and focus restoration.
 *
 * @param props - Component configuration options
 * @returns JSX element containing the interactive locale dropdown
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = "",
  compact = false,
}) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Normalize current locale
  const currentLang = i18n.language ? i18n.language.split("-")[0] : "en";
  const currentLocale: LocaleMeta =
    SUPPORTED_LOCALES.find((l) => l.code === currentLang) || SUPPORTED_LOCALES[0];

  const selectedIndex = SUPPORTED_LOCALES.findIndex((l) => l.code === currentLang);

  const handleSelectLanguage = useCallback(
    (code: string) => {
      i18n.changeLanguage(code);
      updateDocumentDirection(code);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [i18n],
  );

  // Focus management when dropdown opens or active focused option changes
  useEffect(() => {
    if (isOpen) {
      const initialIndex = selectedIndex >= 0 ? selectedIndex : 0;
      setFocusedIndex(initialIndex);
      // Wait for DOM paint then focus active option
      const timer = setTimeout(() => {
        optionRefs.current[initialIndex]?.focus();
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, selectedIndex]);

  // Click outside handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation adhering to W3C ARIA Listbox pattern
  const handleListboxKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const nextIndex = (focusedIndex + 1) % SUPPORTED_LOCALES.length;
        setFocusedIndex(nextIndex);
        optionRefs.current[nextIndex]?.focus();
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prevIndex = (focusedIndex - 1 + SUPPORTED_LOCALES.length) % SUPPORTED_LOCALES.length;
        setFocusedIndex(prevIndex);
        optionRefs.current[prevIndex]?.focus();
        break;
      }
      case "Home": {
        e.preventDefault();
        setFocusedIndex(0);
        optionRefs.current[0]?.focus();
        break;
      }
      case "End": {
        e.preventDefault();
        const lastIndex = SUPPORTED_LOCALES.length - 1;
        setFocusedIndex(lastIndex);
        optionRefs.current[lastIndex]?.focus();
        break;
      }
      case "Escape": {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < SUPPORTED_LOCALES.length) {
          handleSelectLanguage(SUPPORTED_LOCALES[focusedIndex].code);
        }
        break;
      }
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
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
          tabIndex={-1}
          aria-label="Select Language"
          onKeyDown={handleListboxKeyDown}
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
            {SUPPORTED_LOCALES.map((locale, idx) => {
              const isSelected = locale.code === currentLang;
              return (
                <button
                  key={locale.code}
                  ref={(el) => {
                    optionRefs.current[idx] = el;
                  }}
                  role="option"
                  tabIndex={focusedIndex === idx ? 0 : -1}
                  aria-selected={isSelected}
                  onClick={() => handleSelectLanguage(locale.code)}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors focus:outline-none ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 focus:bg-slate-100 dark:focus:bg-zinc-800"
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
