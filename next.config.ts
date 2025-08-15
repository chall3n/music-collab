import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  skipMiddlewareUrlNormalize: true,
};

export default nextConfig;
