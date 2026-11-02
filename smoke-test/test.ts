// Type-check smoke test: verify types resolve correctly for consumers.
// Run with: npx tsc --noEmit

import type {
  KeySource,
  MouserPart,
  SearchByKeywordData,
} from "@bradford-tech/mouser-sdk";
import {
  createMouser,
  getCart,
  searchByKeyword,
  setApiKeys,
} from "@bradford-tech/mouser-sdk";

// Verify the public auth helpers resolve with correct types
setApiKeys({ search: "search-key", order: () => "order-key" });
const _key: KeySource = async () => "key";
const mouser = createMouser({ searchApiKey: "search-key" });

// Verify SDK functions are callable with correct types
const _search: Promise<unknown> = searchByKeyword({
  client: mouser,
  body: { SearchByKeywordRequest: { keyword: "LM358" } },
});
const _cart: Promise<unknown> = getCart({ query: { cartKey: "cart-key" } });

// Verify data types are accessible
type _Part = MouserPart;
type _RequestData = SearchByKeywordData;
