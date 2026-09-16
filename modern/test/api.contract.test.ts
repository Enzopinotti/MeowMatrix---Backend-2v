import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { ApiError } from "../src/api/errors.js";
import type {
  CategoryDto,
  ProductDto,
  ProductListDto,
  ProductListQuery,
} from "../src/api/contracts.js";
import type { CatalogService } from "../src/domain/catalog.js";

const category: CategoryDto = {
  id: "category-1",
  name: "Monitors",
  description: "Displays",
  isVisible: true,
  createdAt: "2026-09-16T12:00:00.000Z",
};

const product: ProductDto = {
  id: "product-1",
  name: "Monitor",
  description: null,
  price: 100,
  code: "MON-1",
  stock: 3,
  categoryId: category.id,
  thumbnailUrls: [],
  status: true,
  isVisible: true,
  tags: ["display"],
  createdAt: "2026-09-16T12:00:00.000Z",
  updatedAt: "2026-09-16T12:00:00.000Z",
};

class TestCatalogService implements CatalogService {
  lastQuery: ProductListQuery | undefined;

  async listProducts(query: ProductListQuery): Promise<ProductListDto> {
    this.lastQuery = query;
    return {
      items: [product],
      total: 1,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async getProductById(id: string): Promise<ProductDto | null> {
    if (id === "conflict") {
      throw ApiError.conflict(
        "PRODUCT_STATE_CONFLICT",
        "Product state conflicts with the request",
      );
    }
    return id === product.id ? product : null;
  }

  async listCategories(): Promise<readonly CategoryDto[]> {
    return [category];
  }

  async getCategoryById(id: string): Promise<CategoryDto | null> {
    return id === category.id ? category : null;
  }
}

let server: Server | undefined;

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      server = undefined;
      if (error) return reject(error);
      resolve();
    });
  });
});

async function startApp(catalogService?: CatalogService) {
  server = createApp(
    catalogService === undefined ? {} : { catalogService },
  ).listen(0);
  await new Promise<void>((resolve) => server?.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

describe("API v1 contract", () => {
  it("publishes B5 metadata while preserving all prior domain schemas", async () => {
    const origin = await startApp(new TestCatalogService());
    const metadataResponse = await fetch(`${origin}/api/v1/`);
    expect(metadataResponse.status).toBe(200);
    expect(await metadataResponse.json()).toMatchObject({
      data: {
        version: "v1",
        contract: "2026-b5",
        implementedResources: expect.arrayContaining([
          "products",
          "categories",
          "auth",
          "cart",
          "checkout",
          "orders",
          "private-files",
        ]),
      },
    });

    const openApiResponse = await fetch(`${origin}/api/v1/openapi.json`);
    const openApi = (await openApiResponse.json()) as {
      info: { version: string };
      components: { schemas: Record<string, unknown> };
      paths: Record<string, unknown>;
    };
    expect(openApiResponse.status).toBe(200);
    expect(openApi.info.version).toBe("1.0.0-b5");
    expect(Object.keys(openApi.components.schemas)).toEqual(
      expect.arrayContaining([
        "Product",
        "Category",
        "Cart",
        "User",
        "Ticket",
        "Order",
        "ErrorEnvelope",
        "CartItem",
        "CartView",
        "CheckoutResult",
        "OrderList",
        "PrivateFile",
        "PrivateFileList",
      ]),
    );
    expect(Object.keys(openApi.paths)).toEqual(
      expect.arrayContaining([
        "/cart",
        "/checkout",
        "/orders",
        "/files",
        "/files/purposes/{purpose}",
        "/files/{fileId}",
        "/files/{fileId}/content",
      ]),
    );
    expect(JSON.stringify(openApi.components.schemas.User)).not.toContain(
      "password",
    );
    expect(JSON.stringify(openApi.components.schemas.User)).not.toContain(
      "resetPassword",
    );
    expect(JSON.stringify(openApi.components.schemas.PrivateFile)).not.toContain(
      "storageKey",
    );
  });

  it("validates list queries and returns a typed success envelope", async () => {
    const catalogService = new TestCatalogService();
    const origin = await startApp(catalogService);
    const response = await fetch(
      `${origin}/api/v1/products?limit=10&offset=2&sort=price_desc&q=monitor`,
    );

    expect(response.status).toBe(200);
    expect(catalogService.lastQuery).toEqual({
      limit: 10,
      offset: 2,
      q: "monitor",
      categoryId: null,
      sort: "price_desc",
    });
    expect(await response.json()).toEqual({
      data: {
        items: [product],
        total: 1,
        limit: 10,
        offset: 2,
      },
    });
  });

  it("returns 400 with field details for invalid input", async () => {
    const origin = await startApp(new TestCatalogService());
    const response = await fetch(`${origin}/api/v1/products?limit=0`);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: [
          { field: "limit", message: "Expected a value between 1 and 100" },
        ],
      },
    });
  });

  it("distinguishes not-found and conflict semantics", async () => {
    const origin = await startApp(new TestCatalogService());

    const missing = await fetch(`${origin}/api/v1/products/missing`);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({
      error: { code: "PRODUCT_NOT_FOUND" },
    });

    const conflict = await fetch(`${origin}/api/v1/products/conflict`);
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      error: { code: "PRODUCT_STATE_CONFLICT" },
    });
  });

  it("fails truthfully when catalog persistence is not connected", async () => {
    const origin = await startApp();
    const response = await fetch(`${origin}/api/v1/products`);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: {
        code: "CATALOG_UNAVAILABLE",
        message:
          "Catalog persistence is not connected to the 2026 API authority yet",
      },
    });
  });
});
