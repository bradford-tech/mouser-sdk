import type { CreateClientConfig } from "./client/client.gen.js";
import { readApiKeysFromEnv } from "./env.js";
import { keyResolver } from "./keys.js";

/**
 * Runtime configuration hook wired via `runtimeConfigPath` in
 * `openapi-ts.config.ts`. Called once on client initialization; installs a
 * default `auth` resolver that reads `MOUSER_SEARCH_API_KEY` and
 * `MOUSER_ORDER_API_KEY` from the environment, so the SDK authenticates with
 * zero configuration when the variables are set. The reads are lazy (per
 * request); `setApiKeys()` replaces this resolver.
 */
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  auth: keyResolver({
    search: () => readApiKeysFromEnv().search,
    order: () => readApiKeysFromEnv().order,
  }),
});
