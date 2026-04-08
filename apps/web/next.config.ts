import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["md-to-naver-blog"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
