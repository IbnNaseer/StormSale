import { describe, it, expect, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { LanguageSelector } from "../components/shared/LanguageSelector";
import i18n from "../lib/i18n";

describe("LanguageSelector Component", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("should render without crashing", () => {
    const html = renderToString(<LanguageSelector />);
    expect(html).toBeTruthy();
    expect(html).toContain("button");
  });

  it("should render button with proper accessibility attributes", () => {
    const html = renderToString(<LanguageSelector />);
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-expanded="false"');
  });

  it("should render the active locale code and flag", () => {
    const html = renderToString(<LanguageSelector />);
    expect(html).toContain("EN");
    expect(html).toContain("🇺🇸");
  });

  it("should render compact version without text label", () => {
    const html = renderToString(<LanguageSelector compact={true} />);
    expect(html).toContain("🇺🇸");
    expect(html).not.toContain("text-xs font-semibold uppercase tracking-wider");
  });

  it("should reflect changed language in rendered output", async () => {
    await i18n.changeLanguage("es");
    const html = renderToString(<LanguageSelector />);
    expect(html).toContain("ES");
    expect(html).toContain("🇪🇸");
  });

  it("should reflect Arabic locale and flag in rendered output", async () => {
    await i18n.changeLanguage("ar");
    const html = renderToString(<LanguageSelector />);
    expect(html).toContain("AR");
    expect(html).toContain("🇸🇦");
  });
});
