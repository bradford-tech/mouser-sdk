/**
 * A `fetch` stand-in that records each request and answers `{}`, so tests can
 * assert on the exact URL (and `apiKey`) the SDK sends without network access.
 */
export function captureFetch(): { fetch: typeof fetch; requests: Request[] } {
  const requests: Request[] = [];
  const fetchStub = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(new Request(input, init));
    return new Response("{}", {
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return { fetch: fetchStub, requests };
}

/** The `apiKey` query parameter of the most recent captured request. */
export function sentApiKey(requests: Request[]): string | null {
  const last = requests.at(-1);
  if (!last) throw new Error("no request was sent");
  return new URL(last.url).searchParams.get("apiKey");
}
