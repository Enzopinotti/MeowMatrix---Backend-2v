const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorEnvelope" },
    },
  },
});

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Meow Matrix API",
    version: "1.0.0-b3",
    description:
      "Authoritative 2026 API contract. B3 adds backend-owned opaque sessions, sanitized user responses, one-time password reset contracts, exact-origin browser policy and bounded auth abuse controls without exposing bearer tokens to browser JavaScript.",
  },
  servers: [{ url: "/api/v1" }],
  paths: {
    "/": {
      get: {
        summary: "Read API contract metadata",
        responses: { "200": { description: "API metadata" } },
      },
    },
    "/openapi.json": {
      get: {
        summary: "Read the OpenAPI contract",
        responses: { "200": { description: "OpenAPI 3.1 document" } },
      },
    },
    "/auth/register": {
      post: {
        summary: "Register a local account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Sanitized user created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: { data: { $ref: "#/components/schemas/User" } },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "409": { $ref: "#/components/responses/Conflict" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
          "503": { $ref: "#/components/responses/ServiceUnavailable" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Create an opaque backend-owned session",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Authenticated session; raw session identifier is returned only as an HttpOnly cookie",
            headers: {
              "Set-Cookie": {
                schema: { type: "string" },
                description: "meow_session opaque HttpOnly cookie",
              },
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: {
                    data: { $ref: "#/components/schemas/AuthSession" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
          "503": { $ref: "#/components/responses/ServiceUnavailable" },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Read the current sanitized user",
        security: [{ cookieSession: [] }],
        responses: {
          "200": {
            description: "Current user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: { data: { $ref: "#/components/schemas/User" } },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "503": { $ref: "#/components/responses/ServiceUnavailable" },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Revoke the current session and expire its cookie",
        security: [{ cookieSession: [] }],
        responses: {
          "204": { description: "Session revoked" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "503": { $ref: "#/components/responses/ServiceUnavailable" },
        },
      },
    },
    "/auth/password-reset/request": {
      post: {
        summary: "Request a password reset without account enumeration",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PasswordResetRequest" },
            },
          },
        },
        responses: {
          "202": {
            description: "Request accepted whether or not the account exists",
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
          "503": { $ref: "#/components/responses/ServiceUnavailable" },
        },
      },
    },
    "/auth/password-reset/confirm": {
      post: {
        summary: "Consume a one-time reset token and invalidate user sessions",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PasswordResetConfirmRequest",
              },
            },
          },
        },
        responses: {
          "204": { description: "Password updated and sessions revoked" },
          "400": { $ref: "#/components/responses/ValidationError" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
          "503": { $ref: "#/components/responses/ServiceUnavailable" },
        },
      },
    },
    "/products": {
      get: {
        summary: "List products",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
          { name: "q", in: "query", schema: { type: "string", maxLength: 120 } },
          { name: "categoryId", in: "query", schema: { type: "string", maxLength: 128 } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "price_asc", "price_desc"], default: "newest" } },
        ],
        responses: {
          "200": {
            description: "Product page",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["data"],
                  properties: { data: { $ref: "#/components/schemas/ProductList" } },
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
          { name: "productId", in: "path", required: true, schema: { type: "string", minLength: 1, maxLength: 128 } },
        ],
        responses: {
          "200": { description: "Product" },
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
          { name: "categoryId", in: "path", required: true, schema: { type: "string", minLength: 1, maxLength: 128 } },
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
    securitySchemes: {
      cookieSession: {
        type: "apiKey",
        in: "cookie",
        name: "meow_session",
        description: "Opaque session identifier. Browser JavaScript must not read or persist it.",
      },
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        additionalProperties: false,
        required: ["name", "lastName", "email", "password"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 80 },
          lastName: { type: "string", minLength: 1, maxLength: 80 },
          email: { type: "string", format: "email", maxLength: 254 },
          password: { type: "string", minLength: 12, maxLength: 128, writeOnly: true },
        },
      },
      LoginRequest: {
        type: "object",
        additionalProperties: false,
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", maxLength: 254 },
          password: { type: "string", minLength: 12, maxLength: 128, writeOnly: true },
        },
      },
      PasswordResetRequest: {
        type: "object",
        additionalProperties: false,
        required: ["email"],
        properties: { email: { type: "string", format: "email", maxLength: 254 } },
      },
      PasswordResetConfirmRequest: {
        type: "object",
        additionalProperties: false,
        required: ["token", "password"],
        properties: {
          token: { type: "string", minLength: 40, maxLength: 128, writeOnly: true },
          password: { type: "string", minLength: 12, maxLength: 128, writeOnly: true },
        },
      },
      AuthSession: {
        type: "object",
        additionalProperties: false,
        required: ["user", "expiresAt"],
        properties: {
          user: { $ref: "#/components/schemas/User" },
          expiresAt: { type: "string", format: "date-time" },
        },
      },
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
        required: ["id", "name", "description", "price", "code", "stock", "categoryId", "thumbnailUrls", "status", "isVisible", "tags", "createdAt", "updatedAt"],
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
          items: { type: "array", items: { $ref: "#/components/schemas/Product" } },
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
          lines: { type: "array", items: { $ref: "#/components/schemas/CartLine" } },
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
        required: ["id", "code", "purchaserId", "status", "lines", "total", "createdAt"],
        properties: {
          id: { type: "string" },
          code: { type: "string" },
          purchaserId: { type: "string" },
          status: { type: "string", enum: ["draft", "confirmed", "partially_fulfilled", "cancelled"] },
          lines: { type: "array", items: { $ref: "#/components/schemas/OrderLine" } },
          total: { type: "number", minimum: 0 },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ApiErrorDetail: {
        type: "object",
        required: ["field", "message"],
        properties: { field: { type: "string" }, message: { type: "string" } },
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
              details: { type: "array", items: { $ref: "#/components/schemas/ApiErrorDetail" } },
            },
          },
        },
      },
    },
    responses: {
      ValidationError: errorResponse("Request failed runtime validation"),
      Unauthorized: errorResponse("Authentication is missing or invalid"),
      Forbidden: errorResponse("Browser origin or authorization policy rejected the request"),
      NotFound: errorResponse("Requested resource does not exist"),
      Conflict: errorResponse("Request conflicts with current resource state"),
      TooManyRequests: errorResponse("Authentication abuse boundary was exceeded"),
      ServiceUnavailable: errorResponse("Required persistence adapter is not connected"),
    },
  },
} as const;
