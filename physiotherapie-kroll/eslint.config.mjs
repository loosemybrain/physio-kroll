import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  {
    ignores: [
      "v0/**",
      "**/v0/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "scripts/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
]);

export default eslintConfig;
