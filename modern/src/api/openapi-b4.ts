import { openApiDocument as baseDocument } from "./openapi.js";

const dataResponse = (description: string, schemaRef: string) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["data"],
        properties: { data: { $ref: schemaRef } },
      },
    },
  },
});

const authenticatedErrors = {
  "400": { $ref: "#/components/responses/ValidationError" },
  "401": { $ref: "#/components/responses/Unauthorized" },
  "403": { $ref: "#/components/responses/Forbidden" },
  "409": { $ref: "#/components/responses/Conflict" },
  "503": { $ref: "#/components/responses/ServiceUnavailable" },
};

export const openApiDocumentB4 = {
  ...baseDocument,
  info: {
    ...baseDocument.info,
    version: "1.0.0-b4",
    description:
      "Authoritative 2026 API contract. B4 activates the historical Mongo catalog and adds a session-owned cart, idempotent all-or-nothing checkout, immutable order snapshots and a transactional outbox boundary. Browser price/stock/total values are never authoritative.",
  },
  paths: {
    ...baseDocument.paths,
    "/cart": {
      get: {
        summary: "Read the current authenticated user's canonical cart",
        security: [{ cookieSession: [] }],
        responses: {
          "200": dataResponse("Current cart", "#/components/schemas/CartView"),
          "401": authenticatedErrors["401"],
          "503": authenticatedErrors["503"],
        },
      },
      delete: {
        summary: "Clear the current authenticated user's cart",
        security: [{ cookieSession: [] }],
        responses: {
          "200": dataResponse("Cleared cart", "#/components/schemas/CartView"),
          ...authenticatedErrors,
        },
      },
    },
    "/cart/items/{productId}": {
      put: {
        summary: "Set one canonical cart line quantity",
        security: [{ cookieSession: [] }],
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "string", minLength: 1, maxLength: 128 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SetCartItemRequest" },
            },
          },
        },
        responses: {
          "200": dataResponse("Updated cart", "#/components/schemas/CartView"),
          "404": { $ref: "#/components/responses/NotFound" },
          ...authenticatedErrors,
        },
      },
      delete: {
        summary: "Remove one product from the current cart",
        security: [{ cookieSession: [] }],
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "string", minLength: 1, maxLength: 128 },
          },
        ],
        responses: {
          "200": dataResponse("Updated cart", "#/components/schemas/CartView"),
          ...authenticatedErrors,
        },
      },
    },
    "/checkout": {
      post: {
        summary: "Atomically checkout the current cart",
        description:
          "Requires Mongo transaction support. The server reprices every product and validates all stock inside the transaction. Any unfulfillable line aborts the entire purchase. Repeating a completed operation with the same key and an empty post-checkout cart returns the original order without decrementing stock again.",
        security: [{ cookieSession: [] }],
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: true,
            schema: {
              type: "string",
              minLength: 8,
              maxLength: 128,
              pattern: "^[A-Za-z0-9._:-]+$",
            },
          },
        ],
        responses: {
          "201": {
            ...dataResponse(
              "New confirmed order",
              "#/components/schemas/CheckoutResult",
            ),
            headers: {
              "Idempotency-Replayed": {
                schema: { type: "string", const: "false" },
              },
            },
          },
          "200": {
            ...dataResponse(
              "Idempotent replay of an existing confirmed order",
              "#/components/schemas/CheckoutResult",
            ),
            headers: {
              "Idempotency-Replayed": {
                schema: { type: "string", const: "true" },
              },
            },
          },
          ...authenticatedErrors,
        },
      },
    },
    "/orders": {
      get: {
        summary: "List orders for the authenticated purchaser",
        security: [{ cookieSession: [] }],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", minimum: 0, default: 0 },
          },
        ],
        responses: {
          "200": dataResponse(
            "Order history",
            "#/components/schemas/OrderList",
          ),
          "400": authenticatedErrors["400"],
          "401": authenticatedErrors["401"],
          "503": authenticatedErrors["503"],
        },
      },
    },
    "/orders/{orderId}": {
      get: {
        summary: "Read one owner-scoped order",
        security: [{ cookieSession: [] }],
        parameters: [
          {
            name: "orderId",
            in: "path",
            required: true,
            schema: { type: "string", minLength: 1, maxLength: 128 },
          },
        ],
        responses: {
          "200": dataResponse("Order", "#/components/schemas/Order"),
          "400": authenticatedErrors["400"],
          "401": authenticatedErrors["401"],
          "404": { $ref: "#/components/responses/NotFound" },
          "503": authenticatedErrors["503"],
        },
      },
    },
  },
  components: {
    ...baseDocument.components,
    schemas: {
      ...baseDocument.components.schemas,
      SetCartItemRequest: {
        type: "object",
        additionalProperties: false,
        required: ["quantity"],
        properties: {
          quantity: { type: "integer", minimum: 1, maximum: 99 },
        },
      },
      CartItem: {
        type: "object",
        additionalProperties: false,
        required: [
          "productId",
          "product",
          "quantity",
          "lineTotal",
          "availability",
          "updatedAt",
        ],
        properties: {
          productId: { type: "string" },
          product: {
            anyOf: [{ $ref: "#/components/schemas/Product" }, { type: "null" }],
          },
          quantity: { type: "integer", minimum: 1, maximum: 99 },
          lineTotal: { type: ["number", "null"], minimum: 0 },
          availability: {
            type: "string",
            enum: ["available", "unavailable", "insufficient_stock"],
          },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CartView: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "userId",
          "items",
          "total",
          "checkoutReady",
          "version",
          "updatedAt",
        ],
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          items: {
            type: "array",
            maxItems: 50,
            items: { $ref: "#/components/schemas/CartItem" },
          },
          total: { type: "number", minimum: 0 },
          checkoutReady: { type: "boolean" },
          version: { type: "integer", minimum: 0 },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CheckoutResult: {
        type: "object",
        additionalProperties: false,
        required: ["order", "replayed"],
        properties: {
          order: { $ref: "#/components/schemas/Order" },
          replayed: { type: "boolean" },
        },
      },
      OrderList: {
        type: "object",
        additionalProperties: false,
        required: ["items", "total", "limit", "offset"],
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/Order" },
          },
          total: { type: "integer", minimum: 0 },
          limit: { type: "integer", minimum: 1, maximum: 100 },
          offset: { type: "integer", minimum: 0 },
        },
      },
    },
  },
} as const;
