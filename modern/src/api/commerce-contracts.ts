import type { OrderDto, ProductDto } from "./contracts.js";
import { ContractValidationError, parseEntityId } from "./contracts.js";

export type CartItemAvailability =
  "available" | "unavailable" | "insufficient_stock";

export type CartItemDto = {
  productId: string;
  product: ProductDto | null;
  quantity: number;
  lineTotal: number | null;
  availability: CartItemAvailability;
  updatedAt: string;
};

export type CartViewDto = {
  id: string;
  userId: string;
  items: readonly CartItemDto[];
  total: number;
  checkoutReady: boolean;
  version: number;
  updatedAt: string;
};

export type CheckoutResultDto = {
  order: OrderDto;
  replayed: boolean;
};

export type SetCartItemRequest = {
  quantity: number;
};

export type OrderListDto = {
  items: readonly OrderDto[];
  total: number;
  limit: number;
  offset: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseSetCartItemRequest(value: unknown): SetCartItemRequest {
  if (!isRecord(value)) {
    throw new ContractValidationError([
      { field: "body", message: "Expected an object" },
    ]);
  }
  const quantity = value.quantity;
  if (
    typeof quantity !== "number" ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 99
  ) {
    throw new ContractValidationError([
      { field: "quantity", message: "Expected an integer between 1 and 99" },
    ]);
  }
  return { quantity };
}

export function parseCommerceProductId(value: unknown): string {
  return parseEntityId(value, "productId");
}

export function parseOrderId(value: unknown): string {
  return parseEntityId(value, "orderId");
}

export function parseIdempotencyKey(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length < 8 ||
    value.length > 128 ||
    !/^[A-Za-z0-9._:-]+$/.test(value)
  ) {
    throw new ContractValidationError([
      {
        field: "Idempotency-Key",
        message:
          "Expected 8-128 characters using letters, numbers, dot, underscore, colon, or dash",
      },
    ]);
  }
  return value;
}

export function parseOrderListQuery(query: Record<string, unknown>): {
  limit: number;
  offset: number;
} {
  const read = (field: "limit" | "offset", fallback: number, max: number) => {
    const raw = query[field];
    if (raw === undefined) return fallback;
    const candidate = Array.isArray(raw) ? raw[0] : raw;
    if (typeof candidate !== "string" || !/^\d+$/.test(candidate)) {
      throw new ContractValidationError([
        { field, message: "Expected a non-negative integer" },
      ]);
    }
    const parsed = Number(candidate);
    if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > max) {
      throw new ContractValidationError([
        { field, message: `Expected a value between 0 and ${max}` },
      ]);
    }
    return parsed;
  };

  const limit = read("limit", 20, 100);
  if (limit < 1) {
    throw new ContractValidationError([
      { field: "limit", message: "Expected a value between 1 and 100" },
    ]);
  }
  return { limit, offset: read("offset", 0, 1_000_000) };
}
