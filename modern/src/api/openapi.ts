export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Meow Matrix API",
    version: "1.0.0-b2",
    description:
      "Authoritative 2026 API contract. Products and categories are the first connected resources; cart, user, ticket and order schemas are reserved for the following authenticated ecommerce blocks.",
  },
  servers: [{ url: "/api/v1" }],
  paths: {
    "/": {
      get: {
        summary: "Read API contract metadata",
        responses: {
          "200": { description: "API metadata" },
        },
      },
    },
    "/openapi.json": {
      get: {
        summary: "Read the OpenAPI contract",
        responses: {
          "200": { description: "OpenAPI 3.1 document" },
        },
      },
    },
    "/products": {
      get: {
        summary: "List products",
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
          {
            name: "q",
            in: "query",
            schema: { type: "string", maxLength: 120 },
          },
          {
            name: "categoryId",
            in: "query",
            schema: { type: "string", maxLength: 128 },
          },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["newest", "price_asc", "price_desc"],
              default: "newest",
            },
          },
        ],
        responses: {
          "200": {
            description: "Product page",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: { $ref: "#/components/schemas/ProductList" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "503": { $ref: "#/components/responses/ServiceUnavailable" },
        },
      },
    },
    "/products/{productId}": {
      get: {
        summary: "Read a product",
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "string", minLength: 1, maxLength: 128 },
          },
        ],
        responses: {
          "200": {
            description: "Product",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: { $ref: "#/components/schemas/Product" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "503": { $ref: "#/components/responses/ServiceUnavailable" },
        },
      },
    },
    "/categories": {
      get: {
        summary: "List categories",
        responses: {
          "200": { description: "Categories" },
          "503": { $ref: "#/components/responses/ServiceUnavailable" },
        },
      },
    },
    "/categories/{categoryId}": {
      get: {
        summary: "Read a category",
        parameters: [
          {
            name: "categoryId",
            in: "path",
            required: true,
            schema: { type: "string", minLength: 1, maxLength: 128 },
          },
        ],
        responses: {
          "200": { description: "Category" },
          "400": { $ref: "#/components/responses/ValidationError" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "503": { $ref: "#/components/responses/ServiceUnavailable" },
        },
      },
    },
  },
  components: {
    schemas: {
      Category: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "description", "isVisible", "createdAt"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          isVisible: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Product: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "name",
          "description",
          "price",
          "code",
          "stock",
          "categoryId",
          "thumbnailUrls",
          "status",
          "isVisible",
          "tags",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: ["string", "null"] },
          price: { type: "number", minimum: 0 },
          code: { type: "string" },
          stock: { type: "number", minimum: 0 },
          categoryId: { type: ["string", "null"] },
          thumbnailUrls: { type: "array", items: { type: "string" } },
          status: { type: "boolean" },
          isVisible: { type: "boolean" },
          tags: { type: "array", items: { type: "string" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProductList: {
        type: "object",
        additionalProperties: false,
        required: ["items", "total", "limit", "offset"],
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/Product" },
          },
          total: { type: "integer", minimum: 0 },
          limit: { type: "integer", minimum: 1, maximum: 100 },
          offset: { type: "integer", minimum: 0 },
        },
      },
      CartLine: {
        type: "object",
        additionalProperties: false,
        required: ["productId", "quantity", "updatedAt"],
        properties: {
          productId: { type: "string" },
          quantity: { type: "integer", minimum: 1 },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Cart: {
        type: "object",
        additionalProperties: false,
        required: ["id", "userId", "lines"],
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          lines: {
            type: "array",
            items: { $ref: "#/components/schemas/CartLine" },
          },
        },
      },
      User: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "lastName", "email", "role", "avatarUrl"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["user", "admin"] },
          avatarUrl: { type: ["string", "null"] },
        },
      },
      Ticket: {
        type: "object",
        additionalProperties: false,
        required: ["id", "code", "purchasedAt", "amount", "purchaserId"],
        properties: {
          id: { type: "string" },
          code: { type: "string" },
          purchasedAt: { type: "string", format: "date-time" },
          amount: { type: "number", minimum: 0 },
          purchaserId: { type: "string" },
        },
      },
      OrderLine: {
        type: "object",
        additionalProperties: false,
        required: ["productId", "name", "unitPrice", "quantity", "lineTotal"],
        properties: {
          productId: { type: "string" },
          name: { type: "string" },
          unitPrice: { type: "number", minimum: 0 },
          quantity: { type: "integer", minimum: 1 },
          lineTotal: { type: "number", minimum: 0 },
        },
      },
      Order: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "code",
          "purchaserId",
          "status",
          "lines",
          "total",
          "createdAt",
        ],
        properties: {
          id: { type: "string" },
          code: { type: "string" },
          purchaserId: { type: "string" },
          status: {
            type: "string",
            enum: ["draft", "confirmed", "partially_fulfilled", "cancelled"],
          },
          lines: {
            type: "array",
            items: { $ref: "#/components/schemas/OrderLine" },
          },
          total: { type: "number", minimum: 0 },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ApiErrorDetail: {
        type: "object",
        required: ["field", "message"],
        properties: {
          field: { type: "string" },
          message: { type: "string" },
        },
      },
      ErrorEnvelope: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: {
                type: "array",
                items: { $ref: "#/components/schemas/ApiErrorDetail" },
              },
            },
          },
        },
      },
    },
    responses: {
      ValidationError: {
        description: "Request failed runtime validation",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorEnvelope" },
          },
        },
      },
      NotFound: {
        description: "Requested resource does not exist",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorEnvelope" },
          },
        },
      },
      Conflict: {
        description: "Request conflicts with current resource state",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorEnvelope" },
          },
        },
      },
      ServiceUnavailable: {
        description: "Required persistence adapter is not connected",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorEnvelope" },
          },
        },
      },
    },
  },
} as const;
