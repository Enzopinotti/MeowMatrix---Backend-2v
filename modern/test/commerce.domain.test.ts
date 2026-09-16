import { describe, expect, it } from "vitest";
import { ApiError } from "../src/api/errors.js";
import type { ProductDto, UserDto } from "../src/api/contracts.js";
import {
  buildCheckoutSnapshot,
  cartFingerprint,
  type CheckoutProduct,
} from "../src/domain/commerce.js";

const user: UserDto = {
  id: "user-1",
  name: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  role: "user",
  avatarUrl: null,
};

function product(overrides: Partial<CheckoutProduct> = {}): CheckoutProduct {
  const base: ProductDto = {
    id: "product-1",
    name: "Keyboard",
    description: null,
    price: 12.34,
    code: "KEY-1",
    stock: 10,
    categoryId: null,
    thumbnailUrls: [],
    status: true,
    isVisible: true,
    tags: [],
    createdAt: "2026-09-16T12:00:00.000Z",
    updatedAt: "2026-09-16T12:00:00.000Z",
  };
  return { ...base, ownerEmail: null, ...overrides };
}

const line = (productId: string, quantity: number) => ({
  productId,
  quantity,
  updatedAt: "2026-09-16T12:00:00.000Z",
});

describe("B4 checkout domain", () => {
  it("fingerprints canonical product/quantity state independent of line order", () => {
    expect(cartFingerprint([line("b", 2), line("a", 1)])).toBe(
      cartFingerprint([line("a", 1), line("b", 2)]),
    );
    expect(cartFingerprint([line("a", 1)])).not.toBe(
      cartFingerprint([line("a", 2)]),
    );
  });

  it("creates immutable server-priced line snapshots and rounds currency", () => {
    const products = new Map<string, CheckoutProduct>([
      ["product-1", product({ price: 10.005 })],
      [
        "product-2",
        product({ id: "product-2", name: "Mouse", price: 2.335, code: "M-2" }),
      ],
    ]);
    const snapshot = buildCheckoutSnapshot({
      user,
      lines: [line("product-1", 2), line("product-2", 3)],
      products,
    });

    expect(snapshot.lines).toEqual([
      {
        productId: "product-1",
        name: "Keyboard",
        unitPrice: 10.005,
        quantity: 2,
        lineTotal: 20.01,
      },
      {
        productId: "product-2",
        name: "Mouse",
        unitPrice: 2.335,
        quantity: 3,
        lineTotal: 7.01,
      },
    ]);
    expect(snapshot.total).toBe(27.02);
  });

  it("rejects the whole checkout when any product cannot be fulfilled", () => {
    const products = new Map<string, CheckoutProduct>([
      ["product-1", product({ stock: 1 })],
      [
        "product-2",
        product({ id: "product-2", name: "Mouse", code: "M-2", stock: 20 }),
      ],
    ]);

    try {
      buildCheckoutSnapshot({
        user,
        lines: [line("product-1", 2), line("product-2", 1)],
        products,
      });
      throw new Error("expected checkout to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        status: 409,
        code: "CHECKOUT_NOT_FULFILLABLE",
        details: [
          {
            field: "product:product-1",
            message: "Only 1 units remain",
          },
        ],
      });
    }
  });

  it("rejects self-purchase and an empty cart", () => {
    expect(() =>
      buildCheckoutSnapshot({ user, lines: [], products: new Map() }),
    ).toThrowError(ApiError);

    try {
      buildCheckoutSnapshot({
        user,
        lines: [line("product-1", 1)],
        products: new Map([
          ["product-1", product({ ownerEmail: "ADA@EXAMPLE.COM" })],
        ]),
      });
      throw new Error("expected self-purchase to fail");
    } catch (error) {
      expect(error).toMatchObject({
        status: 409,
        code: "CHECKOUT_NOT_FULFILLABLE",
      });
    }
  });
});
