import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { createMouser, setApiKeys } from "../src/auth.js";
import { client } from "../src/client/client.gen.js";
import { getCart, searchByKeyword } from "../src/client/index.js";
import { captureFetch, sentApiKey } from "./helpers.js";

// Restored before each test so the shared default client and env are
// order-independent across tests.
const defaultAuth = client.getConfig().auth;
const originalSearch = process.env.MOUSER_SEARCH_API_KEY;
const originalOrder = process.env.MOUSER_ORDER_API_KEY;

const searchBody = { SearchByKeywordRequest: { keyword: "x" } };

beforeEach(() => {
  client.setConfig({ auth: defaultAuth });
  delete process.env.MOUSER_SEARCH_API_KEY;
  delete process.env.MOUSER_ORDER_API_KEY;
});

afterEach(() => {
  if (originalSearch === undefined) delete process.env.MOUSER_SEARCH_API_KEY;
  else process.env.MOUSER_SEARCH_API_KEY = originalSearch;
  if (originalOrder === undefined) delete process.env.MOUSER_ORDER_API_KEY;
  else process.env.MOUSER_ORDER_API_KEY = originalOrder;
});

test("setApiKeys sets both keys", async () => {
  const { fetch, requests } = captureFetch();
  setApiKeys({ search: "S", order: "O" });
  await searchByKeyword({ fetch, body: searchBody });
  assert.equal(sentApiKey(requests), "S");
  await getCart({ fetch, query: { cartKey: "k" } });
  assert.equal(sentApiKey(requests), "O");
});

test("setApiKeys falls back per key to env", async () => {
  const { fetch, requests } = captureFetch();
  process.env.MOUSER_ORDER_API_KEY = "envO";
  setApiKeys({ search: "S" });
  await searchByKeyword({ fetch, body: searchBody });
  assert.equal(sentApiKey(requests), "S");
  await getCart({ fetch, query: { cartKey: "k" } });
  assert.equal(sentApiKey(requests), "envO");
});

test("setApiKeys accepts resolvers", async () => {
  const { fetch, requests } = captureFetch();
  setApiKeys({ search: async () => "S2" });
  await searchByKeyword({ fetch, body: searchBody });
  assert.equal(sentApiKey(requests), "S2");
});

test("setApiKeys replaces the previous configuration", async () => {
  const { fetch, requests } = captureFetch();
  setApiKeys({ search: "S", order: "O" });
  setApiKeys({ search: "S3" });
  await searchByKeyword({ fetch, body: searchBody });
  assert.equal(sentApiKey(requests), "S3");
  const { error } = await getCart({ fetch, query: { cartKey: "k" } });
  assert.match(String(error), /No Mouser order API key/);
  assert.equal(requests.length, 1, "the cart request must not be sent");
});

test("createMouser ignores env", async () => {
  const { fetch, requests } = captureFetch();
  process.env.MOUSER_SEARCH_API_KEY = "envS";
  process.env.MOUSER_ORDER_API_KEY = "envO";
  const mouser = createMouser({ search: "T" });
  await searchByKeyword({ client: mouser, fetch, body: searchBody });
  assert.equal(sentApiKey(requests), "T");
  const { error } = await getCart({
    client: mouser,
    fetch,
    query: { cartKey: "k" },
  });
  assert.match(String(error), /No Mouser order API key/);
  assert.equal(requests.length, 1, "the cart request must not be sent");
});

test("createMouser instances are isolated", async () => {
  const { fetch, requests } = captureFetch();
  const a = createMouser({ search: "A" });
  const b = createMouser({ search: "B" });
  setApiKeys({ search: "D" });
  await searchByKeyword({ client: a, fetch, body: searchBody });
  assert.equal(sentApiKey(requests), "A");
  await searchByKeyword({ client: b, fetch, body: searchBody });
  assert.equal(sentApiKey(requests), "B");
  await searchByKeyword({ fetch, body: searchBody });
  assert.equal(sentApiKey(requests), "D");
});

test("createMouser defaults to the Mouser base URL", async () => {
  const { fetch, requests } = captureFetch();
  const mouser = createMouser({ search: "T" });
  await searchByKeyword({ client: mouser, fetch, body: searchBody });
  assert.equal(requests.length, 1);
  assert.ok(requests[0]?.url.startsWith("https://api.mouser.com/"));
  assert.equal(sentApiKey(requests), "T");
});

test("createMouser honours baseUrl", async () => {
  const { fetch, requests } = captureFetch();
  const mouser = createMouser({
    search: "T",
    baseUrl: "https://proxy.example",
  });
  await searchByKeyword({ client: mouser, fetch, body: searchBody });
  assert.equal(requests.length, 1);
  assert.ok(requests[0]?.url.startsWith("https://proxy.example/"));
});

test("a missing key throws with throwOnError", async () => {
  const { fetch, requests } = captureFetch();
  await assert.rejects(
    getCart({ fetch, query: { cartKey: "k" }, throwOnError: true }),
    { message: /^No Mouser order API key: set MOUSER_ORDER_API_KEY/ },
  );
  assert.equal(requests.length, 0);
});
