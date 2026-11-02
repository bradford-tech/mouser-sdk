// Live check against the real Mouser API. Read-only calls only — never add
// cart-mutating or order-creating operations here.
// Run with: npm run build && npm run live-check   (keys from .env)

import assert from "node:assert/strict";
import { getCurrencies, searchByKeyword } from "../dist/index.js";

for (const name of ["MOUSER_SEARCH_API_KEY", "MOUSER_ORDER_API_KEY"]) {
  assert.ok(process.env[name], `${name} must be set (see .env)`);
}

const search = await searchByKeyword({
  body: { SearchByKeywordRequest: { keyword: "LM358", records: 25 } },
});
assert.equal(search.error, undefined, JSON.stringify(search.error));
assert.deepEqual(search.data?.Errors ?? [], []);
const parts = search.data?.SearchResults?.Parts ?? [];
assert.ok(parts.length > 0, "expected at least one part for LM358");

// `dates: true` turns date-time fields into Date objects; make sure Mouser's
// strings actually parse.
const onOrderDates = parts.flatMap((p) =>
  (p.AvailabilityOnOrder ?? []).map((a) => a.Date).filter(Boolean),
);
for (const date of onOrderDates) {
  assert.ok(date instanceof Date && !Number.isNaN(date.getTime()), `${date}`);
}
console.log(
  `Search: ${parts.length} parts, ${onOrderDates.length} on-order dates parsed.`,
);

const currencies = await getCurrencies({});
assert.equal(currencies.error, undefined, JSON.stringify(currencies.error));
assert.deepEqual(currencies.data?.Errors ?? [], []);
const codes = currencies.data?.Currencies ?? [];
assert.ok(codes.length > 0, "expected at least one currency");
console.log(`Order: ${codes.length} currencies.`);

console.log("Live check passed.");
