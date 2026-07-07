import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF生成用のネイティブ寄りパッケージはバンドルせず実行時に解決する
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
};

export default nextConfig;
