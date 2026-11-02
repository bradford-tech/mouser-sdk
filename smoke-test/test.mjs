// Smoke test: verify the published package shape works at runtime.
// Run after: npm pack
//            npm install ../bradford-tech-mouser-sdk-*.tgz

import assert from "node:assert/strict";

const sdk = await import("@bradford-tech/mouser-sdk");

// Verify key exports exist
for (const name of ["searchByKeyword", "getCart", "createOrder"]) {
  assert.equal(typeof sdk[name], "function", `${name} should be a function`);
}
assert.equal(typeof sdk.client, "object", "client should be an object");
assert.equal(
  typeof sdk.client.setConfig,
  "function",
  "client.setConfig should be a function",
);
assert.equal(
  typeof sdk.setApiKeys,
  "function",
  "setApiKeys should be a function",
);
assert.equal(
  typeof sdk.createMouser,
  "function",
  "createMouser should be a function",
);
assert.equal(
  typeof sdk.createMouser({ search: "test-key" }).post,
  "function",
  "createMouser(...) should return a client",
);

console.log(
  "Smoke test passed: all exports present and correctly typed at runtime.",
);
