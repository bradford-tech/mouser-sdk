import type { Auth } from "./client/core/auth.gen.js";

/** An API key, or a resolver (sync or async) called on every request. */
export type KeySource =
  string | (() => string | undefined | Promise<string | undefined>);

/** Mouser's two API keys: Search, and Order (cart, order, order history). */
export interface MouserKeys {
  search?: KeySource;
  order?: KeySource;
}

/**
 * Builds the client `auth` callback. Every generated operation names the
 * security scheme it needs in `auth.key` (`searchApiKey` or `orderApiKey`, set
 * in `openapi-ts.patch.ts`); this returns the matching key. A missing key
 * resolves to `undefined` — the request is then sent without `apiKey`, never
 * with the other key.
 */
export function keyResolver(
  keys: MouserKeys,
): (auth: Auth) => Promise<string | undefined> {
  return async (auth) => {
    const source =
      auth.key === "searchApiKey"
        ? keys.search
        : auth.key === "orderApiKey"
          ? keys.order
          : undefined;
    return typeof source === "function" ? source() : source;
  };
}
