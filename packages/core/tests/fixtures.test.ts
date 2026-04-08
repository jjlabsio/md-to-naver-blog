import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { convert } from "../src/index.js";

const fixturesDir = join(import.meta.dirname, "fixtures");

const fixtures = readdirSync(fixturesDir)
  .filter((f) => f.endsWith(".input.md"))
  .sort()
  .map((f) => {
    const name = f.replace(".input.md", "");
    const input = readFileSync(join(fixturesDir, f), "utf-8");
    const expected = readFileSync(
      join(fixturesDir, `${name}.expected.html`),
      "utf-8",
    );
    return { name, input, expected };
  });

describe("fixture golden tests", () => {
  for (const { name, input, expected } of fixtures) {
    it(name, () => {
      const result = convert(input);
      expect(result.html.trim()).toBe(expected.trim());
    });
  }
});
