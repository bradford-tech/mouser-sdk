import assert from "node:assert/strict";
import { test } from "node:test";
import { OPERATION_NAMES } from "../openapi-ts.patch.js";
import { createClient, createConfig } from "../src/client/client/index.js";
import * as sdk from "../src/client/index.js";
import { keyResolver } from "../src/keys.js";
import { captureFetch } from "./helpers.js";

test("exports every renamed operation as a function", () => {
  const exports = sdk as unknown as Record<string, unknown>;
  for (const name of Object.values(OPERATION_NAMES)) {
    assert.equal(typeof exports[name], "function", name);
  }
});

// Mouser sends calendar dates without an offset ("2026-11-06T00:00:00");
// turning them into Date objects would read them as host-local time and shift
// them on re-serialization, so they must come back exactly as sent.
test("returns Mouser date strings unchanged", async () => {
  const { fetch } = captureFetch({
    SearchResults: {
      Parts: [{ AvailabilityOnOrder: [{ Date: "2026-11-06T00:00:00" }] }],
    },
  });
  const { data } = await sdk.searchByKeyword({
    fetch,
    body: { SearchByKeywordRequest: { keyword: "x" } },
  });
  assert.equal(
    data?.SearchResults?.Parts?.[0]?.AvailabilityOnOrder?.[0]?.Date,
    "2026-11-06T00:00:00",
  );
});

test("sends each operation's key on the pinned v1 path", async () => {
  const { fetch, requests } = captureFetch();
  const client = createClient(
    createConfig({
      baseUrl: "https://api.mouser.com",
      auth: keyResolver({ search: "S", order: "O" }),
      fetch,
    }),
  );
  await sdk.searchByKeyword({
    client,
    body: { SearchByKeywordRequest: { keyword: "x" } },
  });
  await sdk.getCart({ client, query: { cartKey: "k" } });

  const [search, cart] = requests.map((r) => new URL(r.url));
  assert.equal(
    search?.origin + search?.pathname,
    "https://api.mouser.com/api/v1/search/keyword",
  );
  assert.equal(search?.searchParams.get("apiKey"), "S");
  assert.equal(
    cart?.origin + cart?.pathname,
    "https://api.mouser.com/api/v1/cart",
  );
  assert.equal(cart?.searchParams.get("cartKey"), "k");
  assert.equal(cart?.searchParams.get("apiKey"), "O");
});
