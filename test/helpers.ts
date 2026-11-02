/**
 * A `fetch` stand-in that records each request and answers with `body` (JSON),
 * so tests can assert on the exact URL (and `apiKey`) the SDK sends, and on how
 * it hands back a response, without network access.
 */
export function captureFetch(body: unknown = {}): {
  fetch: typeof fetch;
  requests: Request[];
} {
  const requests: Request[] = [];
  const fetchStub = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(new Request(input, init));
    return new Response(JSON.stringify(body), {
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
