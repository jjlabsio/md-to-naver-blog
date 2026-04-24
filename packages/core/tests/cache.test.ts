import { describe, it, expect } from "vitest";
import { convert, type RenderCache } from "../src/index.js";
import { nodeHash } from "../src/cache.js";

describe("nodeHash", () => {
  it("동일 mdast 노드 shape -> 동일 key 생성", () => {
    const nodeA = {
      type: "heading",
      depth: 2,
      children: [{ type: "text", value: "hello" }],
    };
    const nodeB = {
      type: "heading",
      depth: 2,
      children: [{ type: "text", value: "hello" }],
    };

    expect(nodeHash(nodeA)).toBe(nodeHash(nodeB));
  });

  it("position만 다른 노드 -> 동일 key", () => {
    const nodeA = {
      type: "paragraph",
      children: [{ type: "text", value: "world" }],
      position: { start: { line: 1, column: 1 }, end: { line: 1, column: 6 } },
    };
    const nodeB = {
      type: "paragraph",
      children: [{ type: "text", value: "world" }],
      position: {
        start: { line: 10, column: 1 },
        end: { line: 10, column: 6 },
      },
    };

    expect(nodeHash(nodeA)).toBe(nodeHash(nodeB));
  });

  it("children 다르면 다른 key", () => {
    const nodeA = {
      type: "paragraph",
      children: [{ type: "text", value: "hello" }],
    };
    const nodeB = {
      type: "paragraph",
      children: [{ type: "text", value: "world" }],
    };

    expect(nodeHash(nodeA)).not.toBe(nodeHash(nodeB));
  });

  it("type이 다르면 다른 key", () => {
    const nodeA = {
      type: "heading",
      depth: 1,
      children: [{ type: "text", value: "hello" }],
    };
    const nodeB = {
      type: "paragraph",
      children: [{ type: "text", value: "hello" }],
    };

    expect(nodeHash(nodeA)).not.toBe(nodeHash(nodeB));
  });
});

describe("RenderCache 통합", () => {
  it("convert(md, opts, cache) 두 번 호출 시 두 번째에서 cache hit", () => {
    const md = "# Hello\n\nSome paragraph text here.";
    const cache: RenderCache = new Map();

    const result1 = convert(md, {}, cache);
    const sizeAfterFirst = cache.size;

    expect(sizeAfterFirst).toBeGreaterThan(0);

    const result2 = convert(md, {}, cache);
    const sizeAfterSecond = cache.size;

    // 두 번째 호출에서 cache 크기가 증가하지 않아야 함 (cache hit)
    expect(sizeAfterSecond).toBe(sizeAfterFirst);
    // 결과는 동일해야 함
    expect(result2.html).toBe(result1.html);
    expect(result2.blocks).toEqual(result1.blocks);
  });

  it("한 블록만 수정하면 수정된 블록만 miss, 나머지는 hit", () => {
    const md1 = "# Hello\n\nParagraph one.\n\nParagraph two.";
    const md2 = "# Hello\n\nParagraph changed.\n\nParagraph two.";
    const cache: RenderCache = new Map();

    convert(md1, {}, cache);
    const sizeAfterFirst = cache.size;

    convert(md2, {}, cache);
    const sizeAfterSecond = cache.size;

    // 수정된 블록(Paragraph changed)에 대해서만 새 entry가 추가되어야 함
    // "# Hello"와 "Paragraph two."는 cache hit이므로 크기 증가는 1 이하
    expect(sizeAfterSecond).toBe(sizeAfterFirst + 1);
  });

  it("blank line은 캐시에서 제외", () => {
    const md = "# Hello\n\n\n\nSome text";
    const cache: RenderCache = new Map();

    convert(md, {}, cache);

    // blank line 항목은 cache에 저장되지 않아야 함
    for (const [, entry] of cache) {
      expect(entry.type).not.toBe("blank");
    }
  });
});
