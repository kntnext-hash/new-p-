import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // PDF用HTMLテンプレートはNextのページではなく完結したHTML文書。
    // ページ向けの <head>/フォント規則は適用しない
    files: ["lib/pdf/templates/**"],
    rules: {
      "@next/next/no-head-element": "off",
      "@next/next/no-page-custom-font": "off",
    },
  },
]);

export default eslintConfig;
