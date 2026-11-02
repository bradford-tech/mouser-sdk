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
    // Validate the input spec before generation. `true` means "warn": issues
    // are logged (visible in the update-spec run) but don't fail generation,
    // so a cosmetic upstream spec problem can't block a regeneration.
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
    // No @hey-api/transformers: responses are returned as parsed JSON.
    // - date-time values stay strings: Mouser sends offset-less calendar dates
    //   ("2026-11-06T00:00:00"), which `new Date()` would read as host-local
    //   time and shift when re-serialized.
    // - int64 stays number: Mouser's only int64s are manufacturerId values,
    //   well within Number.MAX_SAFE_INTEGER.
    "@hey-api/typescript",
    {
      name: "@hey-api/sdk",
      auth: true,
      operations: {
        strategy: "flat",
      },
    },
  ],
});
