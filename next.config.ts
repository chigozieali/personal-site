import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    /* pin the workspace root to this project so a stray package-lock.json
       in a parent folder does not get pulled in */
    root: process.cwd(),
  },
};

export default nextConfig;
