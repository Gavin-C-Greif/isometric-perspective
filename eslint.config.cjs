const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "isometric-perspective.zip",
      "scripts/occlusion2 v15 (cpu gpu choose).js",
      "scripts/occlusion2 v21 (simple test 2).js",
      "scripts/occlusion3.js",
    ],
  },
  js.configs.recommended,
  {
    files: ["scripts/**/*.js", "docs/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2024,
        Hooks: "readonly",
        game: "readonly",
        foundry: "readonly",
        canvas: "readonly",
        ui: "readonly",
        CONFIG: "readonly",
        PIXI: "readonly",
        Dialog: "readonly",
        ChatMessage: "readonly",
        fromUuid: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      // Foundry exposes many globals dynamically; avoid noisy false positives.
      "no-undef": "off",
      "no-empty": "warn",
      "no-irregular-whitespace": "warn",
      "no-prototype-builtins": "warn",
      "no-useless-escape": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["tests/**/*.js", "tests/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
  },
  {
    files: ["release.cjs", "release-check.cjs", "release-publish.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
