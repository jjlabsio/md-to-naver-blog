import { describe, expect, it } from "vitest";
import { parseMdx } from "../src/pipeline/parse.js";

interface MdastNode {
  type: string;
  name?: string;
  children?: MdastNode[];
}

describe("parseMdx", () => {
  it("GFM 표 입력을 table 노드로 파싱한다", () => {
    const source = [
      "| h1 | h2 |",
      "| --- | --- |",
      "| a | b |",
    ].join("\n");

    const result = parseMdx(source);

    expect(result.errors).toEqual([]);
    expect(result.mdast.children.map((node) => node.type)).toContain("table");
  });

  it("MDX JSX 블록 입력을 mdxJsxFlowElement 노드로 파싱한다", () => {
    const result = parseMdx("<Foo n={1}>\nbody\n</Foo>");

    expect(result.errors).toEqual([]);
    expect(result.mdast.children[0]).toMatchObject({
      type: "mdxJsxFlowElement",
      name: "Foo",
    });
  });

  it("frontmatter는 gray-matter로 분리하고 본문에는 헤딩만 남긴다", () => {
    const result = parseMdx("---\ntitle: x\n---\n# h");

    expect(result.frontmatter).toEqual({ title: "x" });
    expect(result.errors).toEqual([]);
    expect(result.mdast.children).toHaveLength(1);
    expect(result.mdast.children[0]).toMatchObject({
      type: "heading",
      depth: 1,
    });
  });

  it("GFM 표와 MDX JSX 컨테이너가 섞인 입력을 순서대로 노드화한다", () => {
    const source = [
      "| h1 | h2 |",
      "| --- | --- |",
      "| a | b |",
      "",
      "<Foo n={1}>",
      "body",
      "</Foo>",
    ].join("\n");

    const result = parseMdx(source);
    const flowNodes = result.mdast.children as MdastNode[];

    expect(result.errors).toEqual([]);
    expect(flowNodes.map((node) => node.type)).toEqual([
      "table",
      "mdxJsxFlowElement",
    ]);
    expect(flowNodes[1]).toMatchObject({
      type: "mdxJsxFlowElement",
      name: "Foo",
    });
  });

  it("닫히지 않은 JSX는 throw 없이 MDX_PARSE_ERROR로 수집한다", () => {
    const result = parseMdx("<Callout>\n# heading");

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: "MDX_PARSE_ERROR",
      severity: "error",
      position: {
        line: 1,
        column: 1,
      },
    });
    expect(Array.isArray(result.mdast.children)).toBe(true);
  });

  it("malformed frontmatter도 throw 없이 에러로 수집한다", () => {
    const result = parseMdx("---\ntitle: [\n---\n# h");

    expect(result.frontmatter).toEqual({});
    expect(result.mdast.children).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: "MDX_PARSE_ERROR",
      severity: "error",
    });
    expect(result.errors[0].message).toContain("unexpected end of the stream");
  });

  it("malformed frontmatter 에러는 유효한 position 정보를 포함한다", () => {
    const result = parseMdx("---\ntitle: {\n---\n# h");
    const position = result.errors[0]?.position;

    expect(result.errors).toHaveLength(1);
    expect(position).toEqual(
      expect.objectContaining({
        line: expect.any(Number),
        column: expect.any(Number),
      }),
    );
    expect(position?.line).toBeGreaterThanOrEqual(1);
    expect(position?.column).toBeGreaterThanOrEqual(1);
  });

  it("frontmatter 뒤 MDX 오류 위치는 원문 기준 line으로 보정한다", () => {
    const result = parseMdx("---\ntitle: x\n---\n<Callout>\n# heading");

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: "MDX_PARSE_ERROR",
      severity: "error",
      position: {
        line: 4,
        column: 1,
      },
    });
  });

  it("frontmatter 뒤 MDX 오류 위치는 원문 기준 offset으로 보정한다", () => {
    const source = "---\ntitle: x\n---\n<Foo {>";
    const baseResult = parseMdx("<Foo {>");
    const result = parseMdx(source);

    expect(baseResult.errors).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(baseResult.errors[0]?.position?.offset).toBeTypeOf("number");
    expect(result.errors[0]?.position?.offset).toBe(
      baseResult.errors[0]!.position!.offset! + ("---\ntitle: x\n---\n".length),
    );
  });
});
