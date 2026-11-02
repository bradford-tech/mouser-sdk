interface EnvScope {
  process?: { env?: Record<string, string | undefined> };
}

/**
 * Reads both Mouser API keys from the environment, if present:
 * `MOUSER_SEARCH_API_KEY` (Search API) and `MOUSER_ORDER_API_KEY` (cart, order
 * and order history).
 *
 * `scope` is injectable for testing and defaults to `globalThis`. Using
 * optional chaining means this degrades to `undefined` keys on runtimes where
 * `process` is not defined (browsers, some edge runtimes) instead of throwing.
 */
export function readApiKeysFromEnv(
  scope: EnvScope = globalThis as unknown as EnvScope,
): { search?: string; order?: string } {
  const env = scope.process?.env;
  return {
    search: env?.MOUSER_SEARCH_API_KEY,
    order: env?.MOUSER_ORDER_API_KEY,
  };
}
