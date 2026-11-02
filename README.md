# @bradford-tech/mouser-sdk

A fully-typed, tree-shakeable TypeScript client for the [Mouser Electronics API](https://api.mouser.com/api/docs/ui/index), generated from its OpenAPI specs.

## Install

```bash
npm install @bradford-tech/mouser-sdk
```

Also works with `pnpm add`, `yarn add`, or `bun add`. From [jsr](https://jsr.io/@bradford-tech/mouser-sdk):

```bash
deno add jsr:@bradford-tech/mouser-sdk
```

The client is ESM-only and runs on Node 20+, Deno, Bun, and edge runtimes (it uses the platform `fetch`, with no runtime dependencies).

## Usage

Set your API keys, then call any operation. The base URL (`https://api.mouser.com`) is preconfigured.

```ts
import { searchByKeyword, setApiKeys } from "@bradford-tech/mouser-sdk";

setApiKeys({ search: process.env.MOUSER_SEARCH_API_KEY });

const { data } = await searchByKeyword({
  body: { SearchByKeywordRequest: { keyword: "LM358", records: 5 } },
});
console.log(data?.SearchResults?.Parts?.[0]?.MouserPartNumber);
```

Every operation returns `{ data, error, response }` — `data` is the typed response body, `error` is the typed error body on a non-2xx status, and `response` is the raw `Response`. Pass `{ throwOnError: true }` to throw instead. Mouser also reports problems in an `Errors` array inside `data`, so check both. Date-time fields are returned as Mouser sends them — offset-less strings such as `"2026-11-06T00:00:00"` — rather than `Date` objects, because Mouser does not say which timezone they are in.

## Authentication

Mouser issues two API keys, both sent as the `apiKey` query parameter:

- a **Search API key**, for the search operations;
- an **Order API key**, for cart, order and order history.

Each operation automatically uses the right one. There are three ways to supply them.

**Zero-config:** set `MOUSER_SEARCH_API_KEY` and `MOUSER_ORDER_API_KEY` in the environment and every request uses them automatically — no code required. They are read per request, so loading `.env` after import works too.

**Explicit, shared client:** set keys once for all operations.

```ts
import { setApiKeys } from "@bradford-tech/mouser-sdk";

setApiKeys({ search: "your-search-key", order: "your-order-key" });
// either key also accepts a resolver for rotation / secret managers:
setApiKeys({ search: () => loadKeyFromVault("mouser-search") });
```

A key you leave out keeps falling back to its environment variable. Each `setApiKeys` call replaces the previous one.

If an operation needs a key that was never supplied, no request is sent: the call returns `{ error }` (or throws with `throwOnError: true`) with a message such as `No Mouser order API key: set MOUSER_ORDER_API_KEY, or pass { order } to setApiKeys() or createMouser().`

**Isolated clients:** for multi-tenant servers, concurrent requests with different keys, or test isolation, create independent clients and pass one per call.

```ts
import { createMouser, searchByKeyword } from "@bradford-tech/mouser-sdk";

const mouser = createMouser({ search: "tenant-search-key" });
const { data } = await searchByKeyword({
  client: mouser,
  body: { SearchByKeywordRequest: { keyword: "LM358" } },
});
```

Isolated clients never read the environment: a client created with only a search key returns a missing-key error for cart and order calls instead of borrowing the process-wide order key.

Request your keys from the [Mouser API hub](https://www.mouser.com/api-hub/).

## Coverage

All 24 current operations are generated as standalone, tree-shakeable functions — import only what you use.

| Area          | Functions                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Search        | `searchByKeyword`, `searchByPartNumber`, `searchByKeywordAndManufacturer`, `searchByPartNumberAndManufacturer`, `getManufacturerList`                            |
| Cart          | `getCart`, `updateCart`, `addCartItems`, `updateCartItems`, `removeCartItem`, `addScheduledCartItems`, `updateScheduledCartItems`, `deleteAllScheduledCartItems` |
| Order history | `getOrderHistoryByDateFilter`, `getOrderHistoryByDateRange`, `getOrderHistoryBySalesOrderNumber`, `getOrderHistoryByWebOrderNumber`                              |
| Order         | `queryOrderOptions`, `getCurrencies`, `getCountries`, `createOrder`, `createOrderFromOrder`, `getOrder`, `createCartFromOrder`                                   |

## How the spec is built

Mouser publishes two Swagger 2.0 documents: [V1](https://api.mouser.com/api/docs/V1) (most operations) and [V2](https://api.mouser.com/api/docs/V2) (replacements for three deprecated V1 search operations). `npm run spec:update` converts both to OpenAPI 3.0 with [`swagger2openapi`](https://www.npmjs.com/package/swagger2openapi) and merges them with [`openapi-merge-cli`](https://www.npmjs.com/package/openapi-merge-cli), dropping the deprecated V1 operations, into `spec/openapi.json` — a faithful image of upstream.

At generate time, `openapi-ts.patch.ts` adapts that spec for the SDK: it pins `/api/v{version}/…` paths to `/api/v1/…` (the only version Mouser serves for them), replaces the per-operation `apiKey` parameter with two security schemes, and gives every operation a hand-picked name. An operation without a name fails generation, so new upstream endpoints never ship under an auto-generated name.

## Development

```bash
git clone https://github.com/bradford-tech/mouser-sdk.git
cd mouser-sdk
npm install
npm run build
```

### Common commands

```bash
npm run spec:update  # download, convert and merge the upstream specs
npm run generate     # regenerate the client from spec/openapi.json
npm test             # unit tests (node:test)
npm run type-check   # tsc --noEmit
npm run lint         # eslint (zero warnings tolerance)
npm run fix          # prettier + eslint auto-fix, then type-check
npm run live-check   # read-only calls against the real API (keys from .env)
```

The client in `src/client` is generated by [`@hey-api/openapi-ts`](https://heyapi.dev). A daily GitHub Actions workflow refreshes the specs, regenerates the client, and opens a PR if anything changed — labelled `needs-rename` if Mouser added an operation that needs a name.

## Contributing

Bug reports and pull requests are welcome on [GitHub](https://github.com/bradford-tech/mouser-sdk).

## License

[MIT](./LICENSE)
