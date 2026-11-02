import assert from "node:assert/strict";
import { test } from "node:test";
import { keyResolver } from "../src/keys.js";

const search = { type: "apiKey", key: "searchApiKey" } as const;
const order = { type: "apiKey", key: "orderApiKey" } as const;

const MISSING_ORDER =
  /^No Mouser order API key: set MOUSER_ORDER_API_KEY, or pass \{ order \} to setApiKeys\(\) or createMouser\(\)\.$/;
const MISSING_SEARCH =
  /^No Mouser search API key: set MOUSER_SEARCH_API_KEY, or pass \{ search \} to setApiKeys\(\) or createMouser\(\)\.$/;

test("resolves each scheme to its own key", async () => {
  const resolve = keyResolver({ search: "S", order: "O" });
  assert.equal(await resolve(search), "S");
  assert.equal(await resolve(order), "O");
});

test("resolves an unknown scheme to undefined", async () => {
  const resolve = keyResolver({ search: "S", order: "O" });
  assert.equal(await resolve({ type: "apiKey" }), undefined);
  assert.equal(await resolve({ type: "apiKey", key: "other" }), undefined);
});

test("awaits resolver functions", async () => {
  const resolve = keyResolver({
    search: async () => "S2",
    order: () => "O2",
  });
  assert.equal(await resolve(search), "S2");
  assert.equal(await resolve(order), "O2");
});

test("throws a clear error for a missing order key, never substituting the search key", async () => {
  const resolve = keyResolver({ search: "S" });
  await assert.rejects(resolve(order), { message: MISSING_ORDER });
});

test("throws a clear error for a missing search key", async () => {
  const resolve = keyResolver({ order: "O" });
  await assert.rejects(resolve(search), { message: MISSING_SEARCH });
});

test("treats empty or unresolved keys as missing", async () => {
  await assert.rejects(keyResolver({ order: "" })(order), {
    message: MISSING_ORDER,
  });
  await assert.rejects(keyResolver({ order: async () => undefined })(order), {
    message: MISSING_ORDER,
  });
});
