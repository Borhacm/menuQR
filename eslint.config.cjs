/**
 * ESLint 9 flat config. Uses FlatCompat so `eslint-config-next` (legacy `extends`)
 * keeps working until the package ships native flat exports on your Next version.
 */
const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
      "prisma/migrations/**",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
];
