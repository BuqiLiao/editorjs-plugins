import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dev/**",
      "eslint.config.mjs",
      "vite.config.js",
      "postcss.config.js",
    ],
    files: ["plugins/**/*.ts"],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended
);
