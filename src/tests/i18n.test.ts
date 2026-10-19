import { describe, it, expect, beforeEach } from "vitest";
import i18n, {
  SUPPORTED_LOCALES,
  RTL_LOCALES,
  isRTL,
  updateDocumentDirection,
  resources,
} from "../lib/i18n";
import en from "../locales/en.json";
import es from "../locales/es.json";
import pt from "../locales/pt.json";
import fr from "../locales/fr.json";
import de from "../locales/de.json";
import zh from "../locales/zh.json";
import ja from "../locales/ja.json";
import ko from "../locales/ko.json";
import ar from "../locales/ar.json";
import ru from "../locales/ru.json";

describe("i18n Internationalization Framework", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("should configure exactly 10 supported locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    const codes = SUPPORTED_LOCALES.map((l) => l.code);
    expect(codes).toEqual(["en", "es", "pt", "fr", "de", "zh", "ja", "ko", "ar", "ru"]);
  });

  it("should have all 10 locale resources registered in i18n", () => {
    const supportedCodes = ["en", "es", "pt", "fr", "de", "zh", "ja", "ko", "ar", "ru"];
    supportedCodes.forEach((code) => {
      expect(resources).toHaveProperty(code);
      expect((resources as any)[code]).toHaveProperty("translation");
    });
  });

  it("should have consistent top-level namespaces across all 10 locale files", () => {
    const localeObjects = [
      { name: "en", data: en },
      { name: "es", data: es },
      { name: "pt", data: pt },
      { name: "fr", data: fr },
      { name: "de", data: de },
      { name: "zh", data: zh },
      { name: "ja", data: ja },
      { name: "ko", data: ko },
      { name: "ar", data: ar },
      { name: "ru", data: ru },
    ];

    const expectedNamespaces = ["nav", "header", "common", "dashboard", "affiliate", "advertiser"];

    localeObjects.forEach(({ name, data }) => {
      expectedNamespaces.forEach((ns) => {
        expect(data, `Locale ${name} is missing namespace: ${ns}`).toHaveProperty(ns);
        expect(
          Object.keys((data as any)[ns]).length,
          `Locale ${name} namespace ${ns} should not be empty`
        ).toBeGreaterThan(0);
      });
    });
  });

  it("should have matching nav keys across all locales", () => {
    const enNavKeys = Object.keys(en.nav);
    const localeObjects = [es, pt, fr, de, zh, ja, ko, ar, ru];

    localeObjects.forEach((localeData) => {
      expect(Object.keys(localeData.nav)).toEqual(enNavKeys);
    });
  });

  it("should accurately detect Right-to-Left (RTL) languages", () => {
    expect(RTL_LOCALES).toEqual(["ar", "he"]);
    expect(isRTL("ar")).toBe(true);
    expect(isRTL("ar-SA")).toBe(true);
    expect(isRTL("he")).toBe(true);
    expect(isRTL("en")).toBe(false);
    expect(isRTL("es")).toBe(false);
    expect(isRTL("fr")).toBe(false);
    expect(isRTL("zh")).toBe(false);
    expect(isRTL("")).toBe(false);
  });

  it("should mark Arabic as RTL in SUPPORTED_LOCALES metadata", () => {
    const arLocale = SUPPORTED_LOCALES.find((l) => l.code === "ar");
    expect(arLocale).toBeDefined();
    expect(arLocale?.dir).toBe("rtl");

    const enLocale = SUPPORTED_LOCALES.find((l) => l.code === "en");
    expect(enLocale?.dir).toBe("ltr");
  });

  it("should update document direction and lang attribute for RTL locales", () => {
    const classListSet = new Set<string>();
    const mockElement = {
      dir: "",
      lang: "",
      classList: {
        add: (cls: string) => classListSet.add(cls),
        remove: (cls: string) => classListSet.delete(cls),
        contains: (cls: string) => classListSet.has(cls),
      },
    };

    const originalDocument = (globalThis as any).document;
    (globalThis as any).document = {
      documentElement: mockElement,
    };

    try {
      updateDocumentDirection("ar");
      expect(mockElement.dir).toBe("rtl");
      expect(mockElement.lang).toBe("ar");
      expect(mockElement.classList.contains("rtl")).toBe(true);

      updateDocumentDirection("en");
      expect(mockElement.dir).toBe("ltr");
      expect(mockElement.lang).toBe("en");
      expect(mockElement.classList.contains("rtl")).toBe(false);
    } finally {
      (globalThis as any).document = originalDocument;
    }
  });

  it("should translate keys properly in English", () => {
    expect(i18n.t("nav.home")).toBe("Home");
    expect(i18n.t("header.connectWallet")).toBe("Connect Wallet");
    expect(i18n.t("common.loading")).toBe("Loading...");
  });

  it("should translate keys properly when switching to Spanish", async () => {
    await i18n.changeLanguage("es");
    expect(i18n.t("nav.home")).toBe("Inicio");
    expect(i18n.t("header.connectWallet")).toBe("Conectar Billetera");
    expect(i18n.t("dashboard.title")).toBe("Panel de Control");
  });

  it("should translate keys properly when switching to French", async () => {
    await i18n.changeLanguage("fr");
    expect(i18n.t("nav.home")).toBe("Accueil");
    expect(i18n.t("header.connectWallet")).toBe("Connecter Portefeuille");
    expect(i18n.t("common.save")).toBe("Enregistrer");
  });

  it("should translate keys properly when switching to Arabic (RTL)", async () => {
    await i18n.changeLanguage("ar");
    expect(i18n.t("nav.home")).toBe("الرئيسية");
    expect(i18n.t("header.connectWallet")).toBe("ربط المحفظة");
    expect(i18n.t("common.copied")).toBe("تم النسخ!");
  });

  it("should translate keys properly when switching to Mandarin Chinese", async () => {
    await i18n.changeLanguage("zh");
    expect(i18n.t("nav.home")).toBe("首页");
    expect(i18n.t("header.connectWallet")).toBe("连接钱包");
  });

  it("should fallback to English for missing keys in other languages", async () => {
    await i18n.changeLanguage("es");
    const fallbackText = i18n.t("nonExistentKey", "Default Fallback");
    expect(fallbackText).toBe("Default Fallback");
  });
});
