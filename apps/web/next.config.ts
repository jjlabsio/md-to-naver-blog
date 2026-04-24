import type { NextConfig } from "next";
import { globSync } from "fs";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["md-to-naver-blog"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };

      const root = path.resolve(__dirname, "../..");
      const matches = globSync(
        "node_modules/.pnpm/decode-named-character-reference*/node_modules/decode-named-character-reference/index.js",
        { cwd: root },
      );
      if (matches.length > 0) {
        const staticPath = path.resolve(root, matches[0]);
        config.resolve.alias = {
          ...config.resolve.alias,
          "decode-named-character-reference": staticPath,
        };
      }
    }
    return config;
  },
};

export default nextConfig;
