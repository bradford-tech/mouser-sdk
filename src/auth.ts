import { client } from "./client/client.gen.js";
import {
  type Client,
  createClient,
  createConfig,
} from "./client/client/index.js";
import { envKeys } from "./env.js";
import { keyResolver, type MouserKeys } from "./keys.js";

const BASE_URL = "https://api.mouser.com";

/**
 * Sets Mouser API keys on the shared default client: `search` for the Search
 * API, `order` for cart, order and order history. Each accepts a string, or a
 * resolver (sync or async) for rotation and secret managers; resolvers run per
 * request.
 *
 * A key you omit keeps falling back to its environment variable
 * (`MOUSER_SEARCH_API_KEY` / `MOUSER_ORDER_API_KEY`). Each call replaces the
 * previous configuration entirely. A call that needs a key nobody supplied
 * rejects with an error naming the missing key.
 */
export function setApiKeys(keys: MouserKeys): void {
  const env = envKeys();
  client.setConfig({
    auth: keyResolver({
      search: keys.search ?? env.search,
      order: keys.order ?? env.order,
    }),
  });
}

/**
 * Creates an isolated client bound to its own keys. Use this for multi-tenant
 * servers, concurrent requests with different keys, or test isolation —
 * anywhere mutating the shared default client is unsafe. Pass the returned
 * client per call: `searchByKeyword({ client: mouser, body })`.
 *
 * Environment variables are never consulted: a client created with only
 * `search` rejects cart and order calls with a missing-key error rather than
 * borrowing the process-wide order key.
 */
export function createMouser(
  opts: MouserKeys & { baseUrl?: string } = {},
): Client {
  return createClient(
    createConfig({
      baseUrl: opts.baseUrl ?? BASE_URL,
      auth: keyResolver({ search: opts.search, order: opts.order }),
    }),
  );
}
