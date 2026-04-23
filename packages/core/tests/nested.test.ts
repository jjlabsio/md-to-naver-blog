import { describe, expect, it } from "vitest";
import { convert } from "../src/index.js";

describe("nested JSX component rendering", () => {
  it("<Step> 안에 GFM 표 → 표 HTML이 Step renderer childrenHtml로 전달", () => {
    const md = `<Step>\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n</Step>`;
    const result = convert(md, {
      components: {
        Step: (_props, children) => `<section>${children}</section>`,
      },
    });
    expect(result.html).toContain("<section>");
    expect(result.html).toContain("</section>");
    expect(result.html).toContain("<table");
    expect(result.html).toContain("<td");
    expect(result.errors).toEqual([]);
  });

  it("미등록 <Unknown> → outer 제거, children만 렌더", () => {
    const md = `<Unknown>\nfoo\n</Unknown>`;
    const result = convert(md);
    expect(result.html).toContain("foo");
    expect(result.html).not.toContain("Unknown");
    expect(result.errors).toEqual([]);
  });

  it("Fragment <> → outer 제거, children만 렌더", () => {
    const md = `<>\nbody text\n</>`;
    const result = convert(md);
    expect(result.html).toContain("body text");
    expect(result.errors).toEqual([]);
  });

  it("Callout-in-Callout 동일 태그 중첩 → inner가 outer childrenHtml에 포함", () => {
    const md = `<Callout>\n\n<Callout>\ninner\n</Callout>\n\n</Callout>`;
    let outerChildren = "";
    const result = convert(md, {
      components: {
        Callout: (_props, children) => {
          outerChildren = children;
          return `<div class="callout">${children}</div>`;
        },
      },
    });
    expect(result.html).toContain("inner");
    expect(outerChildren).toContain('<div class="callout">');
    expect(result.html).toMatch(/<div class="callout">.*<div class="callout">/s);
  });
});
