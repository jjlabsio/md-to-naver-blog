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
});
