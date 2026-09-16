import { Router, type RequestHandler } from "express";
import {
  decodeCategoryDto,
  decodeProductDto,
  decodeProductListDto,
  parseEntityId,
  parseProductListQuery,
  type SuccessEnvelope,
} from "./contracts.js";
import { createAuthRouter } from "./auth-routes.js";
import { createCommerceRouter } from "./commerce-routes.js";
import { ApiError } from "./errors.js";
import { openApiDocumentB4 } from "./openapi-b4.js";
import type { AuthService } from "../domain/auth.js";
import type { CatalogService } from "../domain/catalog.js";
import type { CommerceService } from "../domain/commerce.js";
import type {
  BrowserSecurityOptions,
  SessionCookieOptions,
} from "../security/http.js";

export type ApiV1Options = BrowserSecurityOptions & {
  catalogService: CatalogService;
  authService: AuthService;
  commerceService: CommerceService;
  sessionCookieOptions: SessionCookieOptions;
};

function asyncHandler(
  handler: (
    request: Parameters<RequestHandler>[0],
    response: Parameters<RequestHandler>[1],
  ) => Promise<void>,
): RequestHandler {
  return (request, response, next) => {
    void handler(request, response).catch(next);
  };
}

export function createApiV1Router(options: ApiV1Options) {
  const router = Router();

  router.get("/", (_request, response) => {
    response.status(200).json({
      data: {
        name: "Meow Matrix API",
        version: "v1",
        contract: "2026-b4",
        implementedResources: [
          "products",
          "categories",
          "auth",
          "cart",
          "checkout",
          "orders",
        ],
        reservedContracts: ["ticket"],
      },
    });
  });

  router.get("/openapi.json", (_request, response) => {
    response.status(200).json(openApiDocumentB4);
  });

  router.use(
    "/auth",
    createAuthRouter({
      authService: options.authService,
      allowedOrigins: options.allowedOrigins,
      sessionCookieOptions: options.sessionCookieOptions,
    }),
  );

  router.use(
    createCommerceRouter({
      authService: options.authService,
      commerceService: options.commerceService,
      allowedOrigins: options.allowedOrigins,
    }),
  );

  router.get(
    "/products",
    asyncHandler(async (request, response) => {
      const query = parseProductListQuery(request.query);
      const result = decodeProductListDto(
        await options.catalogService.listProducts(query),
      );
      const envelope: SuccessEnvelope<typeof result> = { data: result };
      response.status(200).json(envelope);
    }),
  );

  router.get(
    "/products/:productId",
    asyncHandler(async (request, response) => {
      const productId = parseEntityId(request.params.productId, "productId");
      const product = await options.catalogService.getProductById(productId);
      if (product === null) {
        throw ApiError.notFound("PRODUCT_NOT_FOUND", "Product was not found");
      }
      const decoded = decodeProductDto(product);
      const envelope: SuccessEnvelope<typeof decoded> = { data: decoded };
      response.status(200).json(envelope);
    }),
  );

  router.get(
    "/categories",
    asyncHandler(async (_request, response) => {
      const categories = (await options.catalogService.listCategories()).map(
        decodeCategoryDto,
      );
      const envelope: SuccessEnvelope<typeof categories> = {
        data: categories,
      };
      response.status(200).json(envelope);
    }),
  );

  router.get(
    "/categories/:categoryId",
    asyncHandler(async (request, response) => {
      const categoryId = parseEntityId(request.params.categoryId, "categoryId");
      const category = await options.catalogService.getCategoryById(categoryId);
      if (category === null) {
        throw ApiError.notFound("CATEGORY_NOT_FOUND", "Category was not found");
      }
      const decoded = decodeCategoryDto(category);
      const envelope: SuccessEnvelope<typeof decoded> = { data: decoded };
      response.status(200).json(envelope);
    }),
  );

  return router;
}
