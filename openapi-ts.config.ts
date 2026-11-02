import { defineConfig } from "@hey-api/openapi-ts";

import { patchMouserSpec } from "./openapi-ts.patch.js";

export default defineConfig({
  input: "./spec/openapi.json",
  output: {
    header: (ctx) => ["/* eslint-disable */", ...ctx.defaultValue],
    path: "./src/client",
    clean: false,
    module: {
      extension: ".js", // explicit extensions for Node.js ESM compatibility
    },
    postProcess: [
      { command: "prettier", args: ["{{path}}", "--write"] },
      { command: "eslint", args: ["{{path}}", "--fix"] },
    ],
  },
  parser: {
    // Validate the input spec before generation — catches spec issues early
    // when the Mouser spec is updated.
    validate_EXPERIMENTAL: true,
    // Mouser-specific fixes (v1 paths, auth schemes, operation names).
    patch: { input: patchMouserSpec },
    filters: {
      deprecated: false,
      // Stable output ordering across regenerations — keeps diffs minimal when
      // the spec is refreshed and the API surface is unchanged.
      preserveOrder: true,
    },
  },
  plugins: [
    {
      name: "@hey-api/client-fetch",
      runtimeConfigPath: "./src/hey-api.js",
    },
    "@hey-api/typescript",
    {
      name: "@hey-api/transformers",
      bigInt: false, // int64 stays as number — Mouser's only int64s are manufacturerId values, well within Number.MAX_SAFE_INTEGER
      dates: true, // convert date-time strings to Date objects
    },
    {
      name: "@hey-api/sdk",
      auth: true,
      transformer: true, // wire transformers into SDK response pipeline
      operations: {
        strategy: "flat",
      },
    },
  ],
});
