import { describe, expect, it } from "vitest";
import { convert } from "@jjlabsio/md-to-naver-blog";

describe("CLI 회귀 검증", () => {
  it("convert() 결과에 errors 필드가 있어도 .html과 .title에 정상 접근 가능", () => {
    const result = convert("# Hello\n\nSome content");

    // CLI가 사용하는 필드들
    expect(typeof result.title).toBe("string");
    expect(typeof result.html).toBe("string");
    expect(result.title).toBe("Hello");
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("파싱 에러가 있는 입력도 throw 없이 html을 반환한다", () => {
    // 닫히지 않은 JSX 태그 -- CLI가 이 입력을 처리해도 crash하지 않아야 한다
    const result = convert("<Callout>\n# heading");

    expect(typeof result.html).toBe("string");
    expect(typeof result.title).toBe("string");
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
    // CLI는 errors를 무시하고 html/title만 사용하므로 정상 동작
  });

  it("frontmatter.tags가 배열일 때 CLI에서 안전하게 접근 가능", () => {
    const result = convert(
      '---\ntags: ["tag1", "tag2"]\n---\n# Title\n\nContent',
    );

    expect(Array.isArray(result.frontmatter.tags)).toBe(true);
    const tags = result.frontmatter.tags as string[];
    expect(tags).toEqual(["tag1", "tag2"]);
    // CLI: tags.map(t => `#${t}`).join(' ')
    const tagsStr = tags.map((t) => `#${t}`).join(" ");
    expect(tagsStr).toBe("#tag1 #tag2");
  });

  it("에러가 있는 MDX에서도 frontmatter를 정상적으로 추출한다", () => {
    const result = convert(
      '---\ntags: ["test"]\n---\n<Callout>\n# heading',
    );

    expect(typeof result.frontmatter).toBe("object");
    expect(Array.isArray(result.frontmatter.tags)).toBe(true);
    expect(typeof result.html).toBe("string");
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
