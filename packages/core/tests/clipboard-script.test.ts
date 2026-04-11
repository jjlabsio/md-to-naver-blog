import { describe, it, expect } from "vitest";
import {
  getHtmlClipboardScript,
  getTextClipboardScript,
} from "../src/index.js";

describe("getHtmlClipboardScript", () => {
  it("should include text/html MIME type", () => {
    const script = getHtmlClipboardScript("<p>hello</p>");
    expect(script).toContain("text/html");
  });

  it("should include the provided HTML content", () => {
    const html = "<div><strong>bold</strong></div>";
    const script = getHtmlClipboardScript(html);
    expect(script).toContain("<div><strong>bold</strong></div>");
  });

  it("should safely escape special characters via JSON.stringify", () => {
    const html = `<p>He said "hello" and 'goodbye'</p>\n<p>back\\slash</p>`;
    const script = getHtmlClipboardScript(html);

    // Should not contain raw unescaped quotes that would break the JS string
    // The content should be wrapped in JSON.stringify output
    expect(script).toContain("\\n");
    expect(script).toContain('\\"');
    expect(script).toContain("\\\\");
  });

  it("should return valid JavaScript that can be parsed", () => {
    const html = `<p>"quotes" and 'apostrophes'\nnewline</p>`;
    const script = getHtmlClipboardScript(html);

    // new Function will throw if the JS is not parseable
    expect(() => new Function(script)).not.toThrow();
  });
});

describe("getTextClipboardScript", () => {
  it("should include text/plain MIME type", () => {
    const script = getTextClipboardScript("hello world");
    expect(script).toContain("text/plain");
  });

  it("should include the provided text content", () => {
    const text = "my blog title";
    const script = getTextClipboardScript(text);
    expect(script).toContain("my blog title");
  });

  it("should safely escape special characters via JSON.stringify", () => {
    const text = `He said "hello"\nand 'goodbye'\twith\\backslash`;
    const script = getTextClipboardScript(text);

    expect(script).toContain("\\n");
    expect(script).toContain('\\"');
    expect(script).toContain("\\\\");
  });

  it("should return valid JavaScript that can be parsed", () => {
    const text = `"quotes" and 'apostrophes'\nnewline\ttab`;
    const script = getTextClipboardScript(text);

    expect(() => new Function(script)).not.toThrow();
  });
});
