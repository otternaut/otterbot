import { builtinModules } from "node:module";
import * as paths from "node:path";

/** Keep source import conventions enforceable without a separate import-sorting dependency. */
const imports = {
  meta: {
    type: "suggestion",
    schema: [],
    messages: {
      alias: "Use ~/ for imports that target application files under src/.",
      namespace: "Use a descriptive namespace when importing multiple exports.",
      order:
        "Keep imports first, ordered as libraries, contracts/root code, runtime code, then test/tooling files.",
      spacing: "Keep imports in one continuous block with no blank lines between groups.",
    },
  },
  create(context) {
    const sourceRoot = paths.resolve(import.meta.dirname, "src");

    /**
     * Reject relative module paths resolving inside the application source tree.
     *
     * @param node - Import or export source literal, when present.
     * @returns Nothing; violations are reported to ESLint.
     */
    function checkPath(node) {
      if (typeof node?.value !== "string" || !node.value.startsWith(".")) {
        return;
      }

      const target = paths.resolve(paths.dirname(context.filename), node.value);
      if (target.startsWith(sourceRoot + paths.sep)) {
        context.report({ node, messageId: "alias" });
      }
    }

    /**
     * Rank a module path by its ownership boundary for stable import grouping.
     *
     * @param value - Static module specifier.
     * @returns Library, shared, runtime, or tooling group ordinal.
     */
    function group(value) {
      if (value.startsWith("~/worker/") || value.startsWith("~/runner/")) {
        return 2;
      }

      if (value.startsWith("~/")) {
        return 1;
      }

      return value.startsWith(".") ? 3 : 0;
    }

    return {
      Program(node) {
        let previous;
        let hasStatement = false;

        for (const statement of node.body) {
          if (statement.type !== "ImportDeclaration") {
            hasStatement = true;
            continue;
          }

          checkPath(statement.source);
          if (statement.specifiers.filter((item) => item.type === "ImportSpecifier").length > 1) {
            context.report({ node: statement, messageId: "namespace" });
          }

          if (
            hasStatement ||
            (previous && group(previous.source.value) > group(statement.source.value))
          ) {
            context.report({ node: statement, messageId: "order" });
          }

          if (previous && statement.loc.start.line !== previous.loc.end.line + 1) {
            context.report({ node: statement, messageId: "spacing" });
          }

          previous = statement;
        }
      },
      ExportNamedDeclaration: (node) => checkPath(node.source),
      ExportAllDeclaration: (node) => checkPath(node.source),
      ImportExpression: (node) => checkPath(node.source),
      TSImportType: (node) => checkPath(node.source),
    };
  },
};

/** Enforce runtime ownership and keep test dependencies out of production bundles. */
const boundaries = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      runtime: "Keep runtime-specific dependencies within their owning runtime.",
      test: "Production modules must not import tests or test fixtures.",
    },
  },
  create(context) {
    const root = paths.resolve(import.meta.dirname, "src");
    const owner = paths.relative(root, context.filename).replaceAll(paths.sep, "/");
    if (owner.startsWith("..") || /\.test\.[cm]?[jt]sx?$/u.test(owner)) {
      return {};
    }

    const runner = owner.startsWith("runner/");
    const contracts = owner.startsWith("contracts/");
    const nodeModules = new Set(builtinModules);

    /**
     * Check a dependency's resolved source ownership and runtime requirements.
     *
     * @param node - Static source literal from an import, export, or type reference.
     * @returns Nothing; violations are reported to ESLint.
     */
    function check(node) {
      if (typeof node?.value !== "string") {
        return;
      }

      const name = node.value;
      const target = name.startsWith("~/")
        ? paths.resolve(root, name.slice(2))
        : name.startsWith(".")
          ? paths.resolve(paths.dirname(context.filename), name)
          : undefined;
      const relative = target && paths.relative(root, target).replaceAll(paths.sep, "/");
      if (
        relative &&
        (/\.test\.[cm]?[jt]sx?$/u.test(relative) || relative.startsWith("../test/"))
      ) {
        context.report({ node, messageId: "test" });
        return;
      }

      const nodeOnly =
        name.startsWith("node:") ||
        nodeModules.has(name) ||
        /^(?:@openai\/codex-sdk|@anthropic-ai\/claude-agent-sdk|@cursor\/sdk|@modelcontextprotocol\/sdk|octokit)(?:\/|$)/u.test(
          name,
        );
      const workerOnly = name === "@cloudflare/sandbox" || name.startsWith("@cloudflare/sandbox/");
      const targetRunner = relative?.startsWith("runner/");
      const targetWorker =
        relative?.startsWith("worker/") || /^(?:app|index)(?:\.[cm]?[jt]s)?$/u.test(relative ?? "");
      if (
        (!runner && (nodeOnly || targetRunner)) ||
        (runner && (workerOnly || targetWorker)) ||
        (contracts && (workerOnly || targetWorker))
      ) {
        context.report({ node, messageId: "runtime" });
      }
    }

    return {
      ImportDeclaration: (node) => check(node.source),
      ExportNamedDeclaration: (node) => check(node.source),
      ExportAllDeclaration: (node) => check(node.source),
      ImportExpression: (node) => check(node.source),
      TSImportType: (node) => check(node.source),
    };
  },
};

export const rules = { imports, boundaries };
