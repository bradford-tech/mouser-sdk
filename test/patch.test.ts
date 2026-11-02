import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  OPERATION_NAMES,
  type OpenApiDoc,
  patchMouserSpec,
} from "../openapi-ts.patch.js";

const apiKeyParam = { name: "apiKey", in: "query", required: true };
const versionParam = { name: "version", in: "path", required: true };

function op(operationId: string, tag: string, extraParams: object[] = []) {
  return {
    operationId,
    tags: [tag],
    parameters: [...extraParams, apiKeyParam],
  };
}

function doc(paths: OpenApiDoc["paths"]): OpenApiDoc {
  return { openapi: "3.0.0", paths, components: { schemas: {} } };
}

test("renames templated v1 paths and drops the version param", () => {
  const cartKey = { name: "cartKey", in: "query", required: true };
  const spec = doc({
    "/api/v{version}/cart": {
      get: op("MouserCart_GetCart", "MouserCart", [cartKey, versionParam]),
    },
    "/api/v2/search/manufacturerlist": {
      get: op("SearchApi_GetLwManufacturerList", "SearchApi"),
    },
  });
  patchMouserSpec(spec);
  assert.deepEqual(Object.keys(spec.paths), [
    "/api/v1/cart",
    "/api/v2/search/manufacturerlist",
  ]);
  assert.deepEqual(spec.paths["/api/v1/cart"]?.get?.parameters, [cartKey]);
});

test("preserves path order when renaming", () => {
  const spec = doc({
    "/api/v2/search/keywordandmanufacturer": {
      post: op("SearchApi_LwSearchByKeywordAndManufacturer", "SearchApi"),
    },
    "/api/v{version}/order": {
      post: op("Order_Create", "Order", [versionParam]),
    },
    "/api/v2/search/partnumberandmanufacturer": {
      post: op("SearchApi_LwSearchByPartNumberAndManufacturer", "SearchApi"),
    },
  });
  patchMouserSpec(spec);
  assert.deepEqual(Object.keys(spec.paths), [
    "/api/v2/search/keywordandmanufacturer",
    "/api/v1/order",
    "/api/v2/search/partnumberandmanufacturer",
  ]);
});

test("removes apiKey from every operation", () => {
  const spec = doc({
    "/api/v{version}/cart": {
      get: op("MouserCart_GetCart", "MouserCart", [versionParam]),
      post: op("MouserCart_UpdateCart", "MouserCart", [versionParam]),
    },
  });
  patchMouserSpec(spec);
  const cart = spec.paths["/api/v1/cart"];
  assert.deepEqual(cart?.get?.parameters, []);
  assert.deepEqual(cart?.post?.parameters, []);
});

test("declares both schemes", () => {
  const spec = doc({});
  patchMouserSpec(spec);
  assert.deepEqual(spec.components?.securitySchemes, {
    searchApiKey: { type: "apiKey", in: "query", name: "apiKey" },
    orderApiKey: { type: "apiKey", in: "query", name: "apiKey" },
  });
});

test("assigns security by tag", () => {
  const spec = doc({
    "/a": { post: op("SearchApi_SearchByKeyword", "SearchApi") },
    "/b": { get: op("MouserCart_GetCart", "MouserCart") },
    "/c": { post: op("Order_Create", "Order") },
    "/d": {
      get: op("MouserOrderHistory_OrderHistory", "MouserOrderHistory"),
    },
  });
  patchMouserSpec(spec);
  assert.deepEqual(spec.paths["/a"]?.post?.security, [{ searchApiKey: [] }]);
  assert.deepEqual(spec.paths["/b"]?.get?.security, [{ orderApiKey: [] }]);
  assert.deepEqual(spec.paths["/c"]?.post?.security, [{ orderApiKey: [] }]);
  assert.deepEqual(spec.paths["/d"]?.get?.security, [{ orderApiKey: [] }]);
});

test("renames operationIds from the table", () => {
  const spec = doc({
    "/a": {
      get: op(
        "MouserOrderHistory_GetApiV{versionOrderhistoryByDateRange",
        "MouserOrderHistory",
      ),
    },
    "/b": {
      post: op("SearchApi_LwSearchByKeywordAndManufacturer", "SearchApi"),
    },
  });
  patchMouserSpec(spec);
  assert.equal(
    spec.paths["/a"]?.get?.operationId,
    "getOrderHistoryByDateRange",
  );
  assert.equal(
    spec.paths["/b"]?.post?.operationId,
    "searchByKeywordAndManufacturer",
  );
});

test("throws on an unknown operationId", () => {
  const spec = doc({ "/x": { get: op("Mouser_NewThing", "Order") } });
  assert.throws(
    () => patchMouserSpec(spec),
    (err: Error) =>
      /Mouser_NewThing/.test(err.message) &&
      /openapi-ts\.patch\.ts/.test(err.message),
  );
});

test("covers every operation in spec/openapi.json", () => {
  const spec = JSON.parse(
    readFileSync(new URL("../spec/openapi.json", import.meta.url), "utf8"),
  ) as OpenApiDoc;
  patchMouserSpec(spec);
  const ids = Object.values(spec.paths).flatMap((item) =>
    Object.values(item).map((o) => o.operationId),
  );
  assert.equal(ids.length, 24);
  const names = new Set(Object.values(OPERATION_NAMES));
  for (const id of ids) assert.ok(names.has(id ?? ""), `unexpected ${id}`);
  for (const path of Object.keys(spec.paths)) {
    assert.ok(!path.includes("{version}"), path);
  }
});
