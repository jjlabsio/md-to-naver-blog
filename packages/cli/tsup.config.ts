import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  clean: true,
  platform: "node",
  banner: {
    js: "#!/usr/bin/env node",
  },
});
