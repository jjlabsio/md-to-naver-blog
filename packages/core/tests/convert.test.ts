import { describe, it, expect } from "vitest";
import { convert } from "../src/index.js";

describe("convert", () => {
  it("should return an object with title and html properties", () => {
    const result = convert("# Hello World\n\nSome content");

    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("html");
    expect(result.title).toBe("Hello World");
    expect(typeof result.html).toBe("string");
  });

  // Incomplete block markers ("## ", "- ", "1. ") used to trap parseBlocks
  // in an infinite loop because the prefix matched isBlockStart but the content
  // regex didn't match, leaving `i` unadvanced. Each input must terminate and
  // produce a paragraph fallback.
  it.each(["## ", "### ", "- ", "* ", "1. ", "99. "])(
    "terminates on incomplete block marker %p",
    (input) => {
      const result = convert(input);
      expect(typeof result.html).toBe("string");
      expect(result.blocks.length).toBeGreaterThan(0);
    },
  );

  it("handles intermediate typing states without hanging", () => {
    const states = [
      "#",
      "##",
      "## ",
      "## t",
      "## test",
      "## test\n",
      "## test\n\n",
      "## test\n\n#",
      "## test\n\n##",
      "## test\n\n### ",
      "## test\n\n#### test",
      "- ",
      "- a\n- ",
      "1. a\n2. ",
    ];
    for (const s of states) {
      const result = convert(s);
      expect(typeof result.html).toBe("string");
    }
  });
});
