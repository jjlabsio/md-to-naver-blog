/**
 * Regenerate expected.html for all fixture input files.
 *
 * Usage: pnpm -C packages/core exec tsx scripts/regen-fixtures.ts
 *
 * After running, manually review the diff to ensure naver-style strings
 * (inline CSS, se-ff-nanumgothic, rgb(), &nbsp;, <p>&nbsp;</p>) are preserved.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { convert } from "../src/index.js";

const fixturesDir = join(import.meta.dirname, "..", "tests", "fixtures");

const inputs = readdirSync(fixturesDir)
  .filter((f) => f.endsWith(".input.md"))
  .sort();

for (const f of inputs) {
  const name = f.replace(".input.md", "");
  const input = readFileSync(join(fixturesDir, f), "utf-8");
  const result = convert(input);
  const expectedPath = join(fixturesDir, `${name}.expected.html`);
  writeFileSync(expectedPath, result.html.trim() + "\n", "utf-8");
  process.stdout.write(`[regen] ${name}: ${result.html.trim().length} bytes\n`);
}

process.stdout.write(`\nDone. Regenerated ${inputs.length} fixtures.\n`);
