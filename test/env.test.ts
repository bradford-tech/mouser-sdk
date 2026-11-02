import assert from "node:assert/strict";
import { test } from "node:test";
import { readApiKeysFromEnv } from "../src/env.js";

test("returns both keys when process.env has them", () => {
  const scope = {
    process: {
      env: { MOUSER_SEARCH_API_KEY: "s", MOUSER_ORDER_API_KEY: "o" },
    },
  };
  assert.deepEqual(readApiKeysFromEnv(scope), { search: "s", order: "o" });
});

test("returns no keys and does not throw when process is absent", () => {
  assert.doesNotThrow(() => readApiKeysFromEnv({}));
  assert.deepEqual(readApiKeysFromEnv({}), {
    search: undefined,
    order: undefined,
  });
});

test("returns undefined for an unset variable", () => {
  const scope = { process: { env: { MOUSER_SEARCH_API_KEY: "s" } } };
  assert.deepEqual(readApiKeysFromEnv(scope), {
    search: "s",
    order: undefined,
  });
});
