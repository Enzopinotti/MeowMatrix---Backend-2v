import { Router, type RequestHandler } from "express";
import {
  decodeCategoryDto,
  decodeProductDto,
  decodeProductListDto,
  parseEntityId,
  parseProductListQuery,
  type SuccessEnvelope,
} from "./contracts.js";
import { ApiError } from "./errors.js";
import { openApiDocument } from "./openapi.js";
import type { CatalogService } from "../domain/catalog.js";

export type ApiV1Options = {
  catalogService: CatalogService;
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
        contract: "2026-b2",
        implementedResources: ["products", "categories"],
        reservedContracts: ["cart", "user", "ticket", "order"],
      },
    });
  });

  router.get("/openapi.json", (_request, response) => {
    response.status(200).json(openApiDocument);
  });

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
      const productId = parseEntityId(
        request.params.productId,
        "productId",
      );
      const product = await options.catalogService.getProductById(productId);
      if (product === null) {
        throw ApiError.notFound(
          "PRODUCT_NOT_FOUND",
          "Product was not found",
        );
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
      const categoryId = parseEntityId(
        request.params.categoryId,
        "categoryId",
      );
      const category =
        await options.catalogService.getCategoryById(categoryId);
      if (category === null) {
        throw ApiError.notFound(
          "CATEGORY_NOT_FOUND",
          "Category was not found",
        );
      }
      const decoded = decodeCategoryDto(category);
      const envelope: SuccessEnvelope<typeof decoded> = { data: decoded };
      response.status(200).json(envelope);
    }),
  );

  return router;
}
