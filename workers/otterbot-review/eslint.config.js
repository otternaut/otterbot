import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";
import { rules } from "./eslint-rules.config.js";

export default tseslint.config(
  { ignores: ["node_modules/**", ".output/**", ".wrangler/**", "coverage/**"] },
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  { files: ["**/*.js"], extends: [tseslint.configs.disableTypeChecked] },
  {
    files: ["**/*.ts"],
    plugins: { jsdoc, conventions: { rules } },
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.runner.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      jsdoc: {
        mode: "typescript",
        tagNamePreference: { returns: "returns" },
      },
    },
    rules: {
      curly: ["error", "all"],
      "no-console": "error",
      "conventions/imports": "error",
      "conventions/boundaries": "error",
      "jsdoc/require-description": "error",
      "jsdoc/tag-lines": ["error", "any", { startLines: 1 }],
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: ["return", "block-like"] },
        { blankLine: "always", prev: "block-like", next: "*" },
        { blankLine: "always", prev: ["const", "let"], next: "*" },
        { blankLine: "any", prev: ["const", "let"], next: ["const", "let"] },
        { blankLine: "any", prev: ["const", "let", "expression"], next: "if" },
        { blankLine: "any", prev: "expression", next: "return" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "jsdoc/require-jsdoc": [
        "error",
        {
          contexts: [
            "ExportNamedDeclaration > TSInterfaceDeclaration",
            "ExportNamedDeclaration > TSTypeAliasDeclaration",
          ],
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
          },
        },
      ],
      "jsdoc/require-example": [
        "error",
        {
          contexts: [
            "ExportNamedDeclaration > FunctionDeclaration",
            "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression",
            "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > FunctionExpression",
          ],
        },
      ],
      "jsdoc/require-param": "error",
      "jsdoc/check-param-names": "error",
      "jsdoc/require-param-description": "error",
      "jsdoc/require-returns": "error",
      "jsdoc/require-returns-description": "error",
      "jsdoc/check-tag-names": "error",
    },
  },
  {
    files: [
      "scripts/**/*.ts",
      "src/index.ts",
      "src/app.ts",
      "src/worker/handler.ts",
      "src/runner/index.ts",
      "src/runner/session.ts",
    ],
    rules: { "no-console": "off" },
  },
  {
    files: ["test/**/*.ts", "**/*.test.ts"],
    rules: {
      "jsdoc/require-jsdoc": "off",
      "no-console": "off",
      "jsdoc/require-example": "off",
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
);
