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

// Date-time fields are passed through as Mouser's own strings (`dates: false`
// in openapi-ts.config.ts); make sure they still look like the offset-less
// calendar dates that decision is based on.
const onOrderDates = parts.flatMap((p) =>
  (p.AvailabilityOnOrder ?? []).map((a) => a.Date).filter(Boolean),
);
for (const date of onOrderDates) {
  assert.match(date, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
}
console.log(
  `Search: ${parts.length} parts, ${onOrderDates.length} on-order dates checked.`,
);

const currencies = await getCurrencies({});
assert.equal(currencies.error, undefined, JSON.stringify(currencies.error));
assert.deepEqual(currencies.data?.Errors ?? [], []);
const codes = currencies.data?.Currencies ?? [];
assert.ok(codes.length > 0, "expected at least one currency");
console.log(`Order: ${codes.length} currencies.`);

console.log("Live check passed.");
