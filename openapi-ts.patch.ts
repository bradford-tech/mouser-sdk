/**
 * Fixes applied to the merged Mouser spec (`spec/openapi.json`) at generate
 * time, via `parser.patch.input` in `openapi-ts.config.ts`. The committed spec
 * stays a faithful image of upstream; everything Mouser-specific that the SDK
 * needs lives here.
 */

interface Parameter {
  name: string;
  in: string;
  [key: string]: unknown;
}

interface Operation {
  operationId?: string;
  tags?: string[];
  parameters?: Parameter[];
  security?: Record<string, string[]>[];
  [key: string]: unknown;
}

export interface OpenApiDoc {
  paths: Record<string, Partial<Record<string, Operation>>>;
  components?: {
    securitySchemes?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Upstream operationId → SDK function name. Every upstream operation must be
 * listed: an unknown operationId fails generation so new Mouser endpoints never
 * ship under an auto-generated name.
 */
export const OPERATION_NAMES: Readonly<Record<string, string>> = {
  SearchApi_SearchByKeyword: "searchByKeyword",
  SearchApi_SearchByPartNumber: "searchByPartNumber",
  SearchApi_LwSearchByKeywordAndManufacturer: "searchByKeywordAndManufacturer",
  SearchApi_LwSearchByPartNumberAndManufacturer:
    "searchByPartNumberAndManufacturer",
  SearchApi_GetLwManufacturerList: "getManufacturerList",
  MouserCart_GetCart: "getCart",
  MouserCart_UpdateCart: "updateCart",
  MouserCart_AddCartItems: "addCartItems",
  MouserCart_UpdateCartItems: "updateCartItems",
  MouserCart_RemoveCartItem: "removeCartItem",
  MouserCart_InsertScheduleCartItems: "addScheduledCartItems",
  MouserCart_UpdateScheduleCartItems: "updateScheduledCartItems",
  MouserCart_DeleteAllScheduleCartItems: "deleteAllScheduledCartItems",
  MouserOrderHistory_OrderHistory: "getOrderHistoryByDateFilter",
  "MouserOrderHistory_GetApiV{versionOrderhistoryByDateRange":
    "getOrderHistoryByDateRange",
  MouserOrderHistory_GetOrderAsync: "getOrderHistoryBySalesOrderNumber",
  MouserOrderHistory_GetWebOrderAsync: "getOrderHistoryByWebOrderNumber",
  Order_OptionsQuery: "queryOrderOptions",
  Order_GetCurrencies: "getCurrencies",
  Order_GetCountries: "getCountries",
  Order_Create: "createOrder",
  Order_CreateFromOrder: "createOrderFromOrder",
  Order_GetOrder: "getOrder",
  Order_CreateCartFromOrder: "createCartFromOrder",
};

const HTTP_METHODS = new Set([
  "get",
  "put",
  "post",
  "delete",
  "patch",
  "options",
  "head",
]);

// Mouser issues two keys, both sent as the `apiKey` query parameter: one for
// the Search API, one for cart, order and order history.
const API_KEY_SCHEME = { type: "apiKey", in: "query", name: "apiKey" };

/**
 * Pins `/api/v{version}/…` to `/api/v1/…` (the only version Mouser serves for
 * those routes), replaces the per-operation `apiKey` parameter with two
 * security schemes, and renames operations per {@link OPERATION_NAMES}.
 * Mutates `spec` in place; path order is preserved.
 */
export function patchMouserSpec(spec: OpenApiDoc): void {
  const paths: OpenApiDoc["paths"] = {};
  for (const [path, item] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(item)) {
      if (HTTP_METHODS.has(method) && operation) patchOperation(operation);
    }
    paths[path.replace("/api/v{version}/", "/api/v1/")] = item;
  }
  spec.paths = paths;
  spec.components = {
    ...spec.components,
    securitySchemes: {
      searchApiKey: { ...API_KEY_SCHEME },
      orderApiKey: { ...API_KEY_SCHEME },
    },
  };
}

function patchOperation(operation: Operation): void {
  const upstreamId = operation.operationId ?? "";
  const name = OPERATION_NAMES[upstreamId];
  if (!name) {
    throw new Error(
      `Unknown Mouser operationId "${upstreamId}". Add an SDK name for it to OPERATION_NAMES in openapi-ts.patch.ts.`,
    );
  }
  operation.operationId = name;
  operation.parameters = operation.parameters?.filter(
    (p) => p.name !== "apiKey" && !(p.in === "path" && p.name === "version"),
  );
  const scheme = operation.tags?.includes("SearchApi")
    ? "searchApiKey"
    : "orderApiKey";
  operation.security = [{ [scheme]: [] }];
}
