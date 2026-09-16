import { createHash } from "node:crypto";
import type { UserDto, OrderDto, ProductDto } from "../api/contracts.js";
import type {
  CartViewDto,
  CheckoutResultDto,
  OrderListDto,
} from "../api/commerce-contracts.js";
import { ApiError } from "../api/errors.js";

export type CanonicalCartLine = {
  productId: string;
  quantity: number;
  updatedAt: string;
};

export type CheckoutProduct = ProductDto & {
  ownerEmail: string | null;
};

export type CheckoutSnapshot = {
  lines: OrderDto["lines"];
  total: number;
  fingerprint: string;
};

export interface CommerceService {
  getCart(user: UserDto): Promise<CartViewDto>;
  setCartItem(
    user: UserDto,
    productId: string,
    quantity: number,
  ): Promise<CartViewDto>;
  removeCartItem(user: UserDto, productId: string): Promise<CartViewDto>;
  clearCart(user: UserDto): Promise<CartViewDto>;
  checkout(user: UserDto, idempotencyKey: string): Promise<CheckoutResultDto>;
  listOrders(
    user: UserDto,
    query: { limit: number; offset: number },
  ): Promise<OrderListDto>;
  getOrder(user: UserDto, orderId: string): Promise<OrderDto | null>;
}

export function cartFingerprint(lines: readonly CanonicalCartLine[]): string {
  const canonical = [...lines]
    .map(({ productId, quantity }) => ({ productId, quantity }))
    .sort((left, right) => left.productId.localeCompare(right.productId));
  return createHash("sha256")
    .update(JSON.stringify(canonical), "utf8")
    .digest("base64url");
}

export function idempotencyKeyDigest(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("base64url");
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildCheckoutSnapshot(input: {
  user: UserDto;
  lines: readonly CanonicalCartLine[];
  products: ReadonlyMap<string, CheckoutProduct>;
}): CheckoutSnapshot {
  if (input.lines.length === 0) {
    throw ApiError.conflict("CART_EMPTY", "Cart is empty");
  }

  const problems: Array<{ field: string; message: string }> = [];
  const orderLines: Array<OrderDto["lines"][number]> = [];

  for (const line of input.lines) {
    const product = input.products.get(line.productId);
    if (product === undefined || !product.status || !product.isVisible) {
      problems.push({
        field: `product:${line.productId}`,
        message: "Product is no longer available",
      });
      continue;
    }
    if (
      product.ownerEmail !== null &&
      product.ownerEmail.trim().toLowerCase() === input.user.email.toLowerCase()
    ) {
      problems.push({
        field: `product:${line.productId}`,
        message: "A seller cannot purchase their own product",
      });
      continue;
    }
    if (product.stock < line.quantity) {
      problems.push({
        field: `product:${line.productId}`,
        message: `Only ${Math.max(0, product.stock)} units remain`,
      });
      continue;
    }
    const lineTotal = roundMoney(product.price * line.quantity);
    orderLines.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity: line.quantity,
      lineTotal,
    });
  }

  if (problems.length > 0) {
    throw new ApiError(
      409,
      "CHECKOUT_NOT_FULFILLABLE",
      "Cart cannot be fulfilled atomically",
      problems,
    );
  }

  return {
    lines: orderLines,
    total: roundMoney(
      orderLines.reduce((sum, line) => sum + line.lineTotal, 0),
    ),
    fingerprint: cartFingerprint(input.lines),
  };
}

class UnavailableCommerceService implements CommerceService {
  private unavailable(): never {
    throw ApiError.unavailable(
      "COMMERCE_UNAVAILABLE",
      "Commerce persistence is not connected to the 2026 API authority yet",
    );
  }

  async getCart(_user: UserDto): Promise<CartViewDto> {
    return this.unavailable();
  }
  async setCartItem(
    _user: UserDto,
    _productId: string,
    _quantity: number,
  ): Promise<CartViewDto> {
    return this.unavailable();
  }
  async removeCartItem(
    _user: UserDto,
    _productId: string,
  ): Promise<CartViewDto> {
    return this.unavailable();
  }
  async clearCart(_user: UserDto): Promise<CartViewDto> {
    return this.unavailable();
  }
  async checkout(
    _user: UserDto,
    _idempotencyKey: string,
  ): Promise<CheckoutResultDto> {
    return this.unavailable();
  }
  async listOrders(
    _user: UserDto,
    _query: { limit: number; offset: number },
  ): Promise<OrderListDto> {
    return this.unavailable();
  }
  async getOrder(_user: UserDto, _orderId: string): Promise<OrderDto | null> {
    return this.unavailable();
  }
}

export const unavailableCommerceService: CommerceService =
  new UnavailableCommerceService();
