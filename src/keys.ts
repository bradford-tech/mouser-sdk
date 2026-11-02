import type { Auth } from "./client/core/auth.gen.js";

/** An API key, or a resolver (sync or async) called on every request. */
export type KeySource =
  string | (() => string | undefined | Promise<string | undefined>);

/** Mouser's two API keys: Search, and Order (cart, order, order history). */
export interface MouserKeys {
  search?: KeySource;
  order?: KeySource;
}

const SCHEMES = {
  searchApiKey: { key: "search", env: "MOUSER_SEARCH_API_KEY" },
  orderApiKey: { key: "order", env: "MOUSER_ORDER_API_KEY" },
} as const;

/**
 * Builds the client `auth` callback. Every generated operation names the
 * security scheme it needs in `auth.key` (`searchApiKey` or `orderApiKey`, set
 * in `openapi-ts.patch.ts`); this returns the matching key.
 *
 * A missing (or empty) key throws before the request is sent — it is always a
 * configuration error, and the other key is never substituted. The client
 * surfaces the throw like any request failure: as `{ error }` on the result,
 * or thrown with `throwOnError: true`.
 */
export function keyResolver(
  keys: MouserKeys,
): (auth: Auth) => Promise<string | undefined> {
  return async (auth) => {
    const scheme =
      auth.key === "searchApiKey" || auth.key === "orderApiKey"
        ? SCHEMES[auth.key]
        : undefined;
    if (!scheme) return undefined;
    const source = keys[scheme.key];
    const key = typeof source === "function" ? await source() : source;
    if (!key) {
      throw new Error(
        `No Mouser ${scheme.key} API key: set ${scheme.env}, or pass { ${scheme.key} } to setApiKeys() or createMouser().`,
      );
    }
    return key;
  };
}
