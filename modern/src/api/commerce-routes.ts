import { Router, type RequestHandler } from "express";
import {
  parseCommerceProductId,
  parseIdempotencyKey,
  parseOrderId,
  parseOrderListQuery,
  parseSetCartItemRequest,
} from "./commerce-contracts.js";
import type { SuccessEnvelope, UserDto } from "./contracts.js";
import { ApiError } from "./errors.js";
import type { AuthService } from "../domain/auth.js";
import type { CommerceService } from "../domain/commerce.js";
import {
  createCorsMiddleware,
  createOriginGuard,
  readSessionCookie,
  type BrowserSecurityOptions,
} from "../security/http.js";

export type CommerceRouterOptions = BrowserSecurityOptions & {
  authService: AuthService;
  commerceService: CommerceService;
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

async function currentUser(
  request: Parameters<RequestHandler>[0],
  authService: AuthService,
): Promise<UserDto> {
  const token = readSessionCookie(request.get("cookie"));
  if (token === null) {
    throw new ApiError(401, "SESSION_INVALID", "Authentication required");
  }
  return authService.currentUser(token);
}

export function createCommerceRouter(options: CommerceRouterOptions) {
  const router = Router();
  const originGuard = createOriginGuard(options);

  router.use(createCorsMiddleware(options));
  router.use((_request, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    next();
  });

  router.get(
    "/cart",
    asyncHandler(async (request, response) => {
      const user = await currentUser(request, options.authService);
      const cart = await options.commerceService.getCart(user);
      const envelope: SuccessEnvelope<typeof cart> = { data: cart };
      response.status(200).json(envelope);
    }),
  );

  router.put(
    "/cart/items/:productId",
    originGuard,
    asyncHandler(async (request, response) => {
      const user = await currentUser(request, options.authService);
      const productId = parseCommerceProductId(request.params.productId);
      const { quantity } = parseSetCartItemRequest(request.body);
      const cart = await options.commerceService.setCartItem(
        user,
        productId,
        quantity,
      );
      const envelope: SuccessEnvelope<typeof cart> = { data: cart };
      response.status(200).json(envelope);
    }),
  );

  router.delete(
    "/cart/items/:productId",
    originGuard,
    asyncHandler(async (request, response) => {
      const user = await currentUser(request, options.authService);
      const productId = parseCommerceProductId(request.params.productId);
      const cart = await options.commerceService.removeCartItem(
        user,
        productId,
      );
      const envelope: SuccessEnvelope<typeof cart> = { data: cart };
      response.status(200).json(envelope);
    }),
  );

  router.delete(
    "/cart",
    originGuard,
    asyncHandler(async (request, response) => {
      const user = await currentUser(request, options.authService);
      const cart = await options.commerceService.clearCart(user);
      const envelope: SuccessEnvelope<typeof cart> = { data: cart };
      response.status(200).json(envelope);
    }),
  );

  router.post(
    "/checkout",
    originGuard,
    asyncHandler(async (request, response) => {
      const user = await currentUser(request, options.authService);
      const idempotencyKey = parseIdempotencyKey(
        request.get("Idempotency-Key"),
      );
      const result = await options.commerceService.checkout(
        user,
        idempotencyKey,
      );
      response.setHeader(
        "Idempotency-Replayed",
        result.replayed ? "true" : "false",
      );
      const envelope: SuccessEnvelope<typeof result> = { data: result };
      response.status(result.replayed ? 200 : 201).json(envelope);
    }),
  );

  router.get(
    "/orders",
    asyncHandler(async (request, response) => {
      const user = await currentUser(request, options.authService);
      const query = parseOrderListQuery(request.query);
      const orders = await options.commerceService.listOrders(user, query);
      const envelope: SuccessEnvelope<typeof orders> = { data: orders };
      response.status(200).json(envelope);
    }),
  );

  router.get(
    "/orders/:orderId",
    asyncHandler(async (request, response) => {
      const user = await currentUser(request, options.authService);
      const orderId = parseOrderId(request.params.orderId);
      const order = await options.commerceService.getOrder(user, orderId);
      if (order === null) {
        throw ApiError.notFound("ORDER_NOT_FOUND", "Order was not found");
      }
      const envelope: SuccessEnvelope<typeof order> = { data: order };
      response.status(200).json(envelope);
    }),
  );

  return router;
}
