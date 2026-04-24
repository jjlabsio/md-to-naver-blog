import { describe, expect, it } from "vitest";
import { convert } from "../src/index.js";
import { createError } from "../src/pipeline/errors.js";

describe("ConvertResult.errors", () => {
  it("에러 없는 순수 markdown -> errors는 빈 배열", () => {
    const result = convert("# title\n\nparagraph");

    expect(result.errors).toEqual([]);
  });

  it("닫히지 않은 JSX 태그 -> errors에 MDX_PARSE_ERROR를 수집하고 throw하지 않는다", () => {
    const result = convert("<Callout>\n# hi");

    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatchObject({
      code: "MDX_PARSE_ERROR",
      severity: "error",
    });
  });

  it("import 구문 -> errors에 MDX_IMPORT 1건, html에는 heading만", () => {
    const result = convert("import x from 'y'\n\n# heading");

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MDX_IMPORT", severity: "info" }),
      ]),
    );
    expect(
      result.errors.filter((e) => e.code === "MDX_IMPORT"),
    ).toHaveLength(1);
    expect(result.html).toContain("heading");
    expect(result.html).not.toContain("import");
  });

  it("export 구문 -> errors에 MDX_EXPORT 1건", () => {
    const result = convert("export const a = 1\n\n# heading");

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MDX_EXPORT", severity: "info" }),
      ]),
    );
    expect(
      result.errors.filter((e) => e.code === "MDX_EXPORT"),
    ).toHaveLength(1);
  });

  it("인라인 표현식 {foo} -> errors에 MDX_RUNTIME_EXPR, 해당 위치 빈 문자열", () => {
    const result = convert("hello {foo} world");

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MDX_RUNTIME_EXPR",
          severity: "info",
        }),
      ]),
    );
    expect(result.html).toContain("hello");
    expect(result.html).toContain("world");
    expect(result.html).not.toContain("foo");
  });

  it("블록 표현식 {bar} -> errors에 MDX_RUNTIME_EXPR, 빈 블록 또는 스킵", () => {
    const result = convert("# heading\n\n{bar}\n\nparagraph");

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MDX_RUNTIME_EXPR",
          severity: "info",
        }),
      ]),
    );
    expect(result.html).toContain("heading");
    expect(result.html).toContain("paragraph");
    expect(result.html).not.toContain("bar");
  });
});

describe("createError", () => {
  it("영문 세부 메시지에도 한글 접두어를 붙인다", () => {
    const error = createError("MDX_PARSE_ERROR", "Unexpected token");

    expect(error.message).toBe("MDX 파싱 오류: Unexpected token");
  });

  it("node.position.start를 표준 position으로 변환한다", () => {
    const error = createError("MDX_PARSE_ERROR", "detail", {
      position: {
        start: {
          line: 3,
          column: 7,
          offset: 21,
        },
      },
    });

    expect(error.position).toEqual({
      line: 3,
      column: 7,
      offset: 21,
    });
  });
});
