import { describe, expect, it } from "vitest";
import { openApiDocument } from "../src/api/openapi.js";

describe("OpenAPI B3 regressions", () => {
  it("preserves the typed Product success envelope from B2", () => {
    const response =
      openApiDocument.paths["/products/{productId}"].get.responses["200"];
    expect(response).toMatchObject({
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
    });
  });

  it("documents legacy-compatible login separately from new-password policy", () => {
    const login =
      openApiDocument.components.schemas.LoginRequest.properties.password;
    const registration =
      openApiDocument.components.schemas.RegisterRequest.properties.password;

    expect(login).toMatchObject({ minLength: 1, maxLength: 4096 });
    expect(registration).toMatchObject({ minLength: 12, maxLength: 128 });
  });

  it("keeps opaque cookie sessions as the only declared auth mechanism", () => {
    expect(Object.keys(openApiDocument.components.securitySchemes)).toEqual([
      "cookieSession",
    ]);
    expect(
      openApiDocument.components.securitySchemes.cookieSession,
    ).toMatchObject({
      type: "apiKey",
      in: "cookie",
      name: "meow_session",
    });
    expect(
      JSON.stringify(openApiDocument.components.securitySchemes).toLowerCase(),
    ).not.toContain("bearer");
  });
});
