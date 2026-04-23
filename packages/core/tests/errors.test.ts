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
