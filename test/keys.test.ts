import assert from "node:assert/strict";
import { test } from "node:test";
import { keyResolver } from "../src/keys.js";

const search = { type: "apiKey", key: "searchApiKey" } as const;
const order = { type: "apiKey", key: "orderApiKey" } as const;

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

test("never substitutes the search key for a missing order key", async () => {
  const resolve = keyResolver({ search: "S" });
  assert.equal(await resolve(order), undefined);
});
