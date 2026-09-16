import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import type {
  CartViewDto,
  CheckoutResultDto,
  OrderListDto,
} from "../src/api/commerce-contracts.js";
import type { OrderDto, UserDto } from "../src/api/contracts.js";
import type { AuthService } from "../src/domain/auth.js";
import type { CommerceService } from "../src/domain/commerce.js";

const user: UserDto = {
  id: "user-1",
  name: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  role: "user",
  avatarUrl: null,
};

const emptyCart: CartViewDto = {
  id: "cart-1",
  userId: user.id,
  items: [],
  total: 0,
  checkoutReady: false,
  version: 0,
  updatedAt: "2026-09-16T12:00:00.000Z",
};

const order: OrderDto = {
  id: "order-1",
  code: "MM-order-1",
  purchaserId: user.id,
  status: "confirmed",
  lines: [
    {
      productId: "product-1",
      name: "Keyboard",
      unitPrice: 20,
      quantity: 2,
      lineTotal: 40,
    },
  ],
  total: 40,
  createdAt: "2026-09-16T12:10:00.000Z",
};

function authService(): AuthService {
  return {
    register: vi.fn(),
    login: vi.fn(),
    currentUser: vi.fn(async (token: string) => {
      if (token !== "session-token") throw new Error("unexpected token");
      return user;
    }),
    logout: vi.fn(),
    requestPasswordReset: vi.fn(),
    confirmPasswordReset: vi.fn(),
  };
}

function commerceService(overrides: Partial<CommerceService> = {}): CommerceService {
  const list: OrderListDto = { items: [order], total: 1, limit: 20, offset: 0 };
  return {
    getCart: vi.fn().mockResolvedValue(emptyCart),
    setCartItem: vi.fn().mockResolvedValue(emptyCart),
    removeCartItem: vi.fn().mockResolvedValue(emptyCart),
    clearCart: vi.fn().mockResolvedValue(emptyCart),
    checkout: vi.fn().mockResolvedValue({
      order,
      replayed: false,
    } satisfies CheckoutResultDto),
    listOrders: vi.fn().mockResolvedValue(list),
    getOrder: vi.fn().mockResolvedValue(order),
    ...overrides,
  };
}

let server: Server | undefined;

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      server = undefined;
      if (error) reject(error);
      else resolve();
    });
  });
});

async function startApp(input: {
  auth?: AuthService;
  commerce?: CommerceService;
} = {}) {
  server = createApp({
    ...(input.auth ? { authService: input.auth } : {}),
    ...(input.commerce ? { commerceService: input.commerce } : {}),
    allowedOrigins: ["https://app.example.com"],
  }).listen(0);
  await new Promise<void>((resolve) => server?.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

const authHeaders = {
  Cookie: "meow_session=session-token",
};

const mutationHeaders = {
  ...authHeaders,
  Origin: "https://app.example.com",
  "Content-Type": "application/json",
};

describe("B4 commerce HTTP contract", () => {
  it("requires the backend-owned session before reading a cart", async () => {
    const commerce = commerceService();
    const origin = await startApp({ auth: authService(), commerce });
    const response = await fetch(`${origin}/api/v1/cart`);

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: { code: "SESSION_INVALID" },
    });
    expect(commerce.getCart).not.toHaveBeenCalled();
  });

  it("validates quantity and exact browser Origin before mutating cart", async () => {
    const commerce = commerceService();
    const origin = await startApp({ auth: authService(), commerce });

    const invalidQuantity = await fetch(
      `${origin}/api/v1/cart/items/product-1`,
      {
        method: "PUT",
        headers: mutationHeaders,
        body: JSON.stringify({ quantity: 100 }),
      },
    );
    expect(invalidQuantity.status).toBe(400);
    expect(commerce.setCartItem).not.toHaveBeenCalled();

    const evilOrigin = await fetch(`${origin}/api/v1/cart/items/product-1`, {
      method: "PUT",
      headers: {
        ...mutationHeaders,
        Origin: "https://evil.example.com",
      },
      body: JSON.stringify({ quantity: 1 }),
    });
    expect(evilOrigin.status).toBe(403);
    expect(commerce.setCartItem).not.toHaveBeenCalled();
  });

  it("requires an idempotency key and exposes replay semantics", async () => {
    const checkout = vi
      .fn()
      .mockResolvedValueOnce({ order, replayed: false })
      .mockResolvedValueOnce({ order, replayed: true });
    const commerce = commerceService({ checkout });
    const origin = await startApp({ auth: authService(), commerce });

    const missingKey = await fetch(`${origin}/api/v1/checkout`, {
      method: "POST",
      headers: mutationHeaders,
    });
    expect(missingKey.status).toBe(400);
    expect(checkout).not.toHaveBeenCalled();

    const first = await fetch(`${origin}/api/v1/checkout`, {
      method: "POST",
      headers: { ...mutationHeaders, "Idempotency-Key": "checkout-key-0001" },
    });
    expect(first.status).toBe(201);
    expect(first.headers.get("Idempotency-Replayed")).toBe("false");

    const retry = await fetch(`${origin}/api/v1/checkout`, {
      method: "POST",
      headers: { ...mutationHeaders, "Idempotency-Key": "checkout-key-0001" },
    });
    expect(retry.status).toBe(200);
    expect(retry.headers.get("Idempotency-Replayed")).toBe("true");
    expect(checkout).toHaveBeenNthCalledWith(1, user, "checkout-key-0001");
    expect(checkout).toHaveBeenNthCalledWith(2, user, "checkout-key-0001");
  });

  it("keeps order detail owner-scoped at the service boundary", async () => {
    const commerce = commerceService({
      getOrder: vi.fn().mockResolvedValue(null),
    });
    const origin = await startApp({ auth: authService(), commerce });
    const response = await fetch(`${origin}/api/v1/orders/missing`, {
      headers: authHeaders,
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: { code: "ORDER_NOT_FOUND" },
    });
  });

  it("fails truthfully when commerce persistence is not connected", async () => {
    const origin = await startApp({ auth: authService() });
    const response = await fetch(`${origin}/api/v1/cart`, {
      headers: authHeaders,
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: { code: "COMMERCE_UNAVAILABLE" },
    });
  });
});
