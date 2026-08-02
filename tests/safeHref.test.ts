/**
 * `safeHref` is the link sanitizer for EPUB export. The version it replaced
 * checked only `startsWith("javascript:")`, which let `data:text/html,…` and
 * `vbscript:` through — a reader application that honours either runs the
 * author's markup as script. These tests pin the allowlist, including the
 * control-character trick that walks a literal prefix check.
 */
import { describe, expect, it } from "vitest";
import { safeHref } from "@/utils/epubExport";

describe("safeHref", () => {
  it("keeps the schemes a book legitimately links with", () => {
    for (const href of [
      "https://example.com/chapter",
      "http://example.com",
      "HTTPS://EXAMPLE.COM",
      "mailto:author@example.com",
    ]) {
      expect(safeHref(href)).toBe(href);
    }
  });

  it("keeps relative and fragment links, which carry no scheme", () => {
    for (const href of ["#footnote-3", "../chapter-2.xhtml", "/index.html"]) {
      expect(safeHref(href)).toBe(href);
    }
  });

  it("neutralizes javascript:, the case the old check caught", () => {
    expect(safeHref("javascript:alert(1)")).toBe("#");
    expect(safeHref("JaVaScRiPt:alert(1)")).toBe("#");
    expect(safeHref("  javascript:alert(1)  ")).toBe("#");
  });

  it("neutralizes data: and vbscript:, the cases it did not", () => {
    expect(safeHref("data:text/html,<script>alert(1)</script>")).toBe("#");
    expect(safeHref("vbscript:msgbox(1)")).toBe("#");
  });

  it("neutralizes a scheme hidden behind control characters", () => {
    // A parser that strips these before resolving the URL still sees
    // "javascript:", so a literal startsWith check is not enough.
    expect(safeHref("java\tscript:alert(1)")).toBe("#");
    expect(safeHref("java\nscript:alert(1)")).toBe("#");
    expect(safeHref("java\u0000script:alert(1)")).toBe("#");
    expect(safeHref("\u0001javascript:alert(1)")).toBe("#");
  });

  it("neutralizes schemes nobody thought to ban", () => {
    // The point of an allowlist: these were never enumerated anywhere.
    expect(safeHref("file:///etc/passwd")).toBe("#");
    expect(safeHref("blob:https://example.com/uuid")).toBe("#");
    expect(safeHref("about:blank")).toBe("#");
  });

  it("returns # for an empty or whitespace-only href", () => {
    expect(safeHref("")).toBe("#");
    expect(safeHref("   ")).toBe("#");
  });
});
