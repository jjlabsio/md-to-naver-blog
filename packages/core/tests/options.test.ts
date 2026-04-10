import { describe, it, expect } from "vitest";
import { convert } from "../src/index.js";

describe("frontmatter", () => {
  it("returns parsed frontmatter in result", () => {
    const md = `---
title: "테스트 글"
description: "설명"
date: 2026-04-06
keywords:
  - 키워드1
  - 키워드2
---

# 테스트 글

본문입니다.`;

    const result = convert(md);

    expect(result.frontmatter).toEqual({
      title: "테스트 글",
      description: "설명",
      date: new Date("2026-04-06"),
      keywords: ["키워드1", "키워드2"],
    });
  });

  it("returns empty object when no frontmatter", () => {
    const result = convert("# Hello\n\nWorld");
    expect(result.frontmatter).toEqual({});
  });

  it("still includes tags as hashtags in html", () => {
    const md = `---
tags:
  - 마크다운
  - 블로그
---

# 제목

본문`;

    const result = convert(md);

    expect(result.html).toContain("<p>#마크다운 #블로그</p>");
    expect(result.frontmatter.tags).toEqual(["마크다운", "블로그"]);
  });
});

describe("transformUrl", () => {
  it("transforms relative link URLs", () => {
    const md = "# 제목\n\n[링크](/blog/some-post)";

    const result = convert(md, {
      transformUrl: ({ raw }) =>
        raw.startsWith("http") ? raw : `https://example.com${raw}`,
    });

    expect(result.html).toContain('href="https://example.com/blog/some-post"');
  });

  it("leaves external URLs unchanged when transform returns them as-is", () => {
    const md = "# 제목\n\n[외부](https://other.com/page)";

    const result = convert(md, {
      transformUrl: ({ raw }) =>
        raw.startsWith("http") ? raw : `https://example.com${raw}`,
    });

    expect(result.html).toContain('href="https://other.com/page"');
  });

  it("transforms image URLs", () => {
    const md = "# 제목\n\n![사진](/images/photo.png)";

    const result = convert(md, {
      transformUrl: ({ raw }) =>
        raw.startsWith("http") ? raw : `https://cdn.example.com${raw}`,
    });

    expect(result.html).toContain(
      'src="https://cdn.example.com/images/photo.png"',
    );
  });

  it("transforms block-level image URLs", () => {
    const md = "# 제목\n\n![사진](/images/photo.png)";

    const result = convert(md, {
      transformUrl: ({ raw }) => `https://cdn.example.com${raw}`,
    });

    expect(result.html).toContain(
      'src="https://cdn.example.com/images/photo.png"',
    );
  });

  it("provides type context to distinguish links and images", () => {
    const types: string[] = [];

    const md = "# 제목\n\n[링크](/page) ![이미지](/img.png)";

    convert(md, {
      transformUrl: (ctx) => {
        types.push(ctx.type);
        return ctx.raw;
      },
    });

    expect(types).toContain("link");
    expect(types).toContain("image");
  });

  it("does not transform URLs inside code blocks", () => {
    const md = "# 제목\n\n```\n[링크](/blog/post)\n```";

    const result = convert(md, {
      transformUrl: ({ raw }) => `https://example.com${raw}`,
    });

    expect(result.html).not.toContain("https://example.com");
  });

  it("does not transform URLs inside inline code", () => {
    const md = "# 제목\n\n텍스트 `[링크](/blog/post)` 텍스트";

    const result = convert(md, {
      transformUrl: ({ raw }) => `https://example.com${raw}`,
    });

    expect(result.html).not.toContain("https://example.com");
  });

  it("transforms URLs in tables", () => {
    const md = `# 제목

| 항목 | 링크 |
| --- | --- |
| A | [보기](/page-a) |`;

    const result = convert(md, {
      transformUrl: ({ raw }) =>
        raw.startsWith("http") ? raw : `https://example.com${raw}`,
    });

    expect(result.html).toContain('href="https://example.com/page-a"');
  });

  it("transforms URLs in blockquotes", () => {
    const md = "# 제목\n\n> [참고](/reference)";

    const result = convert(md, {
      transformUrl: ({ raw }) => `https://example.com${raw}`,
    });

    expect(result.html).toContain('href="https://example.com/reference"');
  });

  it("transforms URLs in list items", () => {
    const md = "# 제목\n\n- [항목](/item)";

    const result = convert(md, {
      transformUrl: ({ raw }) => `https://example.com${raw}`,
    });

    expect(result.html).toContain('href="https://example.com/item"');
  });

  it("works without options (backward compatible)", () => {
    const md = "# 제목\n\n[링크](/blog/post)";

    const result = convert(md);

    expect(result.html).toContain('href="/blog/post"');
  });

  it("transforms linked image URLs", () => {
    const md = "# 제목\n\n[![alt](/img.png)](/page)";

    const result = convert(md, {
      transformUrl: ({ type, raw }) =>
        type === "image"
          ? `https://cdn.example.com${raw}`
          : `https://example.com${raw}`,
    });

    expect(result.html).toContain('src="https://cdn.example.com/img.png"');
    expect(result.html).toContain('href="https://example.com/page"');
  });

  it("transforms Hugo figure src", () => {
    const md =
      '# 제목\n\n{{< figure src="/img.png" alt="사진" caption="설명" >}}';

    const result = convert(md, {
      transformUrl: ({ raw }) => `https://cdn.example.com${raw}`,
    });

    expect(result.html).toContain('src="https://cdn.example.com/img.png"');
  });
});
