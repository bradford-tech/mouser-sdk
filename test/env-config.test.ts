import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { client } from "../src/client/client.gen.js";
import { searchByKeyword } from "../src/client/index.js";
import { captureFetch, sentApiKey } from "./helpers.js";

const originalSearch = process.env.MOUSER_SEARCH_API_KEY;
const originalOrder = process.env.MOUSER_ORDER_API_KEY;

afterEach(() => {
  if (originalSearch === undefined) delete process.env.MOUSER_SEARCH_API_KEY;
  else process.env.MOUSER_SEARCH_API_KEY = originalSearch;
  if (originalOrder === undefined) delete process.env.MOUSER_ORDER_API_KEY;
  else process.env.MOUSER_ORDER_API_KEY = originalOrder;
});

test("default client resolves each key from its env var", async () => {
  process.env.MOUSER_SEARCH_API_KEY = "env-s";
  process.env.MOUSER_ORDER_API_KEY = "env-o";
  const { auth } = client.getConfig();
  assert.ok(typeof auth === "function");
  assert.equal(await auth({ type: "apiKey", key: "searchApiKey" }), "env-s");
  assert.equal(await auth({ type: "apiKey", key: "orderApiKey" }), "env-o");
});

test("picks up an env var set after import", async () => {
  delete process.env.MOUSER_SEARCH_API_KEY;
  const { fetch, requests } = captureFetch();
  process.env.MOUSER_SEARCH_API_KEY = "late";
  await searchByKeyword({
    fetch,
    body: { SearchByKeywordRequest: { keyword: "x" } },
  });
  assert.equal(sentApiKey(requests), "late");
});
