import { Router, type RequestHandler } from "express";
import {
  parseLoginRequest,
  parsePasswordResetConfirmRequest,
  parsePasswordResetRequest,
  parseRegisterRequest,
  type AuthSessionDto,
} from "./auth-contracts.js";
import type { SuccessEnvelope } from "./contracts.js";
import { ApiError } from "./errors.js";
import type { AuthService } from "../domain/auth.js";
import {
  createCorsMiddleware,
  createOriginGuard,
  expiredSessionCookie,
  readSessionCookie,
  sessionCookie,
  type BrowserSecurityOptions,
  type SessionCookieOptions,
} from "../security/http.js";
import {
  authRateLimitPolicies,
  createRateLimiter,
  type RateLimitStore,
} from "../security/rate-limit.js";

export type AuthRouterOptions = BrowserSecurityOptions & {
  authService: AuthService;
  sessionCookieOptions: SessionCookieOptions;
  rateLimitStore?: RateLimitStore;
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

export function createAuthRouter(options: AuthRouterOptions) {
  const router = Router();
  const originGuard = createOriginGuard(options);
  const loginLimiter = createRateLimiter(authRateLimitPolicies.login, {
    ...(options.rateLimitStore ? { store: options.rateLimitStore } : {}),
    scope: "auth:login",
  });
  const registerLimiter = createRateLimiter(authRateLimitPolicies.register, {
    ...(options.rateLimitStore ? { store: options.rateLimitStore } : {}),
    scope: "auth:register",
  });
  const resetLimiter = createRateLimiter(authRateLimitPolicies.passwordReset, {
    ...(options.rateLimitStore ? { store: options.rateLimitStore } : {}),
    scope: "auth:password-reset",
  });

  router.use(createCorsMiddleware(options));
  router.use((_request, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    next();
  });

  router.post(
    "/register",
    originGuard,
    registerLimiter,
    asyncHandler(async (request, response) => {
      const input = parseRegisterRequest(request.body);
      const user = await options.authService.register(input);
      const envelope: SuccessEnvelope<typeof user> = { data: user };
      response.status(201).json(envelope);
    }),
  );

  router.post(
    "/login",
    originGuard,
    loginLimiter,
    asyncHandler(async (request, response) => {
      const input = parseLoginRequest(request.body);
      const session = await options.authService.login(input);
      response.setHeader(
        "Set-Cookie",
        sessionCookie(session.sessionToken, options.sessionCookieOptions),
      );
      const data: AuthSessionDto = {
        user: session.user,
        expiresAt: new Date(session.expiresAt).toISOString(),
      };
      const envelope: SuccessEnvelope<AuthSessionDto> = { data };
      response.status(200).json(envelope);
    }),
  );

  router.get(
    "/me",
    asyncHandler(async (request, response) => {
      const token = readSessionCookie(request.get("cookie"));
      if (token === null) {
        throw new ApiError(401, "SESSION_INVALID", "Authentication required");
      }
      const user = await options.authService.currentUser(token);
      const envelope: SuccessEnvelope<typeof user> = { data: user };
      response.status(200).json(envelope);
    }),
  );

  router.post(
    "/logout",
    originGuard,
    asyncHandler(async (request, response) => {
      const token = readSessionCookie(request.get("cookie"));
      await options.authService.logout(token);
      response.setHeader(
        "Set-Cookie",
        expiredSessionCookie(options.sessionCookieOptions),
      );
      response.status(204).end();
    }),
  );

  router.post(
    "/password-reset/request",
    originGuard,
    resetLimiter,
    asyncHandler(async (request, response) => {
      const input = parsePasswordResetRequest(request.body);
      await options.authService.requestPasswordReset(input.email);
      response.status(202).json({ data: { accepted: true } });
    }),
  );

  router.post(
    "/password-reset/confirm",
    originGuard,
    resetLimiter,
    asyncHandler(async (request, response) => {
      const input = parsePasswordResetConfirmRequest(request.body);
      await options.authService.confirmPasswordReset(input);
      response.status(204).end();
    }),
  );

  return router;
}
