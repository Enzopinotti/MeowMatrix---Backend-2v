import { randomUUID } from "node:crypto";
import {
  ObjectId,
  type ClientSession,
  type Collection,
  type Db,
  type Document,
  type MongoClient,
} from "mongodb";
import type {
  CartItemDto,
  CartViewDto,
  CheckoutResultDto,
  OrderListDto,
} from "../api/commerce-contracts.js";
import type { OrderDto, UserDto } from "../api/contracts.js";
import { ApiError } from "../api/errors.js";
import {
  buildCheckoutSnapshot,
  idempotencyKeyDigest,
  type CanonicalCartLine,
  type CheckoutProduct,
  type CommerceService,
} from "../domain/commerce.js";
import { mapMongoProduct } from "./mongo-catalog.js";

const MAX_CART_LINES = 50;

type CartLineDocument = {
  productId: ObjectId;
  quantity: number;
  updatedAt: Date;
};

type CartDocument = {
  _id: ObjectId;
  userId: string;
  lines: CartLineDocument[];
  version: number;
  updatedAt: Date;
};

type OrderLineDocument = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

type OrderDocument = {
  _id: ObjectId;
  code: string;
  purchaserId: string;
  status: "confirmed";
  lines: OrderLineDocument[];
  total: number;
  idempotencyKeyHash: string;
  cartFingerprint: string;
  createdAt: Date;
};

type OutboxDocument = {
  _id: ObjectId;
  type: "order.confirmed";
  aggregateId: string;
  purchaserId: string;
  createdAt: Date;
  availableAt: Date;
  processedAt: Date | null;
  attempts: number;
};

function asObjectId(id: string): ObjectId | null {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

function mapOrder(document: OrderDocument): OrderDto {
  return {
    id: document._id.toHexString(),
    code: document.code,
    purchaserId: document.purchaserId,
    status: document.status,
    lines: document.lines,
    total: document.total,
    createdAt: document.createdAt.toISOString(),
  };
}

function canonicalLines(document: CartDocument): CanonicalCartLine[] {
  return document.lines.map((line) => ({
    productId: line.productId.toHexString(),
    quantity: line.quantity,
    updatedAt: line.updatedAt.toISOString(),
  }));
}

function duplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function transactionUnsupported(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: unknown; message?: unknown };
  return (
    candidate.code === 20 ||
    (typeof candidate.message === "string" &&
      /transaction numbers are only allowed|replica set|mongos/i.test(
        candidate.message,
      ))
  );
}

export async function ensureCommerceIndexes(db: Db): Promise<void> {
  await db.collection<CartDocument>("commerce_carts").createIndex(
    { userId: 1 },
    { unique: true, name: "commerce_cart_user_unique" },
  );
  await db.collection<OrderDocument>("commerce_orders").createIndexes([
    {
      key: { purchaserId: 1, idempotencyKeyHash: 1 },
      unique: true,
      name: "commerce_order_idempotency_unique",
    },
    { key: { purchaserId: 1, createdAt: -1 }, name: "commerce_order_history" },
  ]);
  await db.collection<OutboxDocument>("commerce_outbox").createIndexes([
    {
      key: { processedAt: 1, availableAt: 1 },
      name: "commerce_outbox_pending",
    },
    { key: { aggregateId: 1 }, name: "commerce_outbox_order" },
  ]);
}

export class MongoCommerceService implements CommerceService {
  private readonly carts: Collection<CartDocument>;
  private readonly orders: Collection<OrderDocument>;
  private readonly products: Collection<Document>;
  private readonly outbox: Collection<OutboxDocument>;

  constructor(
    private readonly client: MongoClient,
    db: Db,
  ) {
    this.carts = db.collection<CartDocument>("commerce_carts");
    this.orders = db.collection<OrderDocument>("commerce_orders");
    this.products = db.collection("products");
    this.outbox = db.collection<OutboxDocument>("commerce_outbox");
  }

  private async ensureCart(
    userId: string,
    session?: ClientSession,
  ): Promise<CartDocument> {
    const now = new Date();
    try {
      await this.carts.updateOne(
        { userId },
        {
          $setOnInsert: {
            userId,
            lines: [],
            version: 0,
            updatedAt: now,
          },
        },
        { upsert: true, session },
      );
    } catch (error) {
      if (!duplicateKey(error)) throw error;
    }
    const cart = await this.carts.findOne({ userId }, { session });
    if (cart === null) throw new Error("Commerce cart could not be created");
    return cart;
  }

  private async productDocument(
    productId: string,
    session?: ClientSession,
  ): Promise<Document | null> {
    const _id = asObjectId(productId);
    if (_id === null) return null;
    return this.products.findOne({ _id }, { session });
  }

  private assertProductCanEnterCart(
    user: UserDto,
    productId: string,
    document: Document | null,
  ): void {
    if (
      document === null ||
      document.status === false ||
      document.isVisible === false
    ) {
      throw ApiError.notFound("PRODUCT_NOT_FOUND", "Product was not found");
    }
    if (
      typeof document.owner === "string" &&
      document.owner.trim().toLowerCase() === user.email.toLowerCase()
    ) {
      throw ApiError.conflict(
        "OWN_PRODUCT_NOT_ALLOWED",
        "A seller cannot add their own product to the cart",
      );
    }
    const mapped = mapMongoProduct(document);
    if (mapped.stock < 1) {
      throw ApiError.conflict(
        "PRODUCT_OUT_OF_STOCK",
        `Product ${productId} is out of stock`,
      );
    }
  }

  private async cartView(
    user: UserDto,
    cart: CartDocument,
    session?: ClientSession,
  ): Promise<CartViewDto> {
    const productIds = cart.lines.map((line) => line.productId);
    const documents =
      productIds.length === 0
        ? []
        : await this.products
            .find({ _id: { $in: productIds } }, { session })
            .toArray();
    const byId = new Map(
      documents.map((document) => [String(document._id), document]),
    );

    let total = 0;
    const items: CartItemDto[] = cart.lines.map((line) => {
      const productId = line.productId.toHexString();
      const document = byId.get(productId);
      if (
        document === undefined ||
        document.status === false ||
        document.isVisible === false
      ) {
        return {
          productId,
          product: null,
          quantity: line.quantity,
          lineTotal: null,
          availability: "unavailable",
          updatedAt: line.updatedAt.toISOString(),
        };
      }
      const product = mapMongoProduct(document);
      const lineTotal = Math.round(product.price * line.quantity * 100) / 100;
      const availability =
        product.stock >= line.quantity ? "available" : "insufficient_stock";
      if (availability === "available") total += lineTotal;
      return {
        productId,
        product,
        quantity: line.quantity,
        lineTotal,
        availability,
        updatedAt: line.updatedAt.toISOString(),
      };
    });

    return {
      id: cart._id.toHexString(),
      userId: user.id,
      items,
      total: Math.round(total * 100) / 100,
      checkoutReady:
        items.length > 0 && items.every((item) => item.availability === "available"),
      version: cart.version,
      updatedAt: cart.updatedAt.toISOString(),
    };
  }

  private async replaceLinesOptimistically(
    user: UserDto,
    transform: (lines: CartLineDocument[]) => CartLineDocument[],
  ): Promise<CartViewDto> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const cart = await this.ensureCart(user.id);
      const nextLines = transform(cart.lines);
      const now = new Date();
      const result = await this.carts.updateOne(
        { _id: cart._id, version: cart.version },
        {
          $set: { lines: nextLines, updatedAt: now },
          $inc: { version: 1 },
        },
      );
      if (result.modifiedCount === 1) {
        const updated = await this.carts.findOne({ _id: cart._id });
        if (updated === null) throw new Error("Commerce cart disappeared");
        return this.cartView(user, updated);
      }
    }
    throw ApiError.conflict(
      "CART_CONCURRENT_UPDATE",
      "Cart changed concurrently; retry the request",
    );
  }

  async getCart(user: UserDto): Promise<CartViewDto> {
    return this.cartView(user, await this.ensureCart(user.id));
  }

  async setCartItem(
    user: UserDto,
    productId: string,
    quantity: number,
  ): Promise<CartViewDto> {
    const _id = asObjectId(productId);
    if (_id === null) {
      throw ApiError.notFound("PRODUCT_NOT_FOUND", "Product was not found");
    }
    const product = await this.productDocument(productId);
    this.assertProductCanEnterCart(user, productId, product);

    return this.replaceLinesOptimistically(user, (lines) => {
      const existing = lines.find((line) => line.productId.equals(_id));
      if (existing === undefined && lines.length >= MAX_CART_LINES) {
        throw ApiError.conflict(
          "CART_LINE_LIMIT",
          `Cart supports at most ${MAX_CART_LINES} distinct products`,
        );
      }
      const updatedAt = new Date();
      return [
        ...lines.filter((line) => !line.productId.equals(_id)),
        { productId: _id, quantity, updatedAt },
      ];
    });
  }

  async removeCartItem(user: UserDto, productId: string): Promise<CartViewDto> {
    const _id = asObjectId(productId);
    if (_id === null) return this.getCart(user);
    return this.replaceLinesOptimistically(user, (lines) =>
      lines.filter((line) => !line.productId.equals(_id)),
    );
  }

  async clearCart(user: UserDto): Promise<CartViewDto> {
    return this.replaceLinesOptimistically(user, () => []);
  }

  private async existingOrder(
    purchaserId: string,
    idempotencyKeyHash: string,
  ): Promise<OrderDocument | null> {
    return this.orders.findOne({ purchaserId, idempotencyKeyHash });
  }

  async checkout(
    user: UserDto,
    idempotencyKey: string,
  ): Promise<CheckoutResultDto> {
    const keyHash = idempotencyKeyDigest(idempotencyKey);
    const existing = await this.existingOrder(user.id, keyHash);
    if (existing !== null) {
      const currentCart = await this.ensureCart(user.id);
      if (currentCart.lines.length === 0) {
        return { order: mapOrder(existing), replayed: true };
      }
      throw ApiError.conflict(
        "IDEMPOTENCY_KEY_REUSED",
        "Idempotency key already belongs to a completed checkout",
      );
    }

    try {
      const result = await this.client.withSession(async (session) =>
        session.withTransaction(async () => {
          const cart = await this.ensureCart(user.id, session);
          if (cart.lines.length === 0) {
            const replay = await this.orders.findOne(
              { purchaserId: user.id, idempotencyKeyHash: keyHash },
              { session },
            );
            if (replay !== null) {
              return { order: mapOrder(replay), replayed: true };
            }
            throw ApiError.conflict("CART_EMPTY", "Cart is empty");
          }

          const productIds = cart.lines.map((line) => line.productId);
          const productDocuments = await this.products
            .find({ _id: { $in: productIds } }, { session })
            .toArray();
          const products = new Map<string, CheckoutProduct>();
          for (const document of productDocuments) {
            const product = mapMongoProduct(document);
            products.set(product.id, {
              ...product,
              ownerEmail:
                typeof document.owner === "string" ? document.owner : null,
            });
          }

          const snapshot = buildCheckoutSnapshot({
            user,
            lines: canonicalLines(cart),
            products,
          });
          const now = new Date();
          const order: OrderDocument = {
            _id: new ObjectId(),
            code: `MM-${randomUUID()}`,
            purchaserId: user.id,
            status: "confirmed",
            lines: [...snapshot.lines],
            total: snapshot.total,
            idempotencyKeyHash: keyHash,
            cartFingerprint: snapshot.fingerprint,
            createdAt: now,
          };

          await this.orders.insertOne(order, { session });

          for (const line of cart.lines) {
            const stockResult = await this.products.updateOne(
              {
                _id: line.productId,
                status: { $ne: false },
                isVisible: { $ne: false },
                stock: { $gte: line.quantity },
              },
              {
                $inc: { stock: -line.quantity },
                $set: { updatedAt: now },
              },
              { session },
            );
            if (stockResult.modifiedCount !== 1) {
              throw ApiError.conflict(
                "STOCK_CHANGED",
                "Stock changed while checkout was being committed",
                [
                  {
                    field: `product:${line.productId.toHexString()}`,
                    message: "Stock is no longer sufficient",
                  },
                ],
              );
            }
          }

          const cartResult = await this.carts.updateOne(
            { _id: cart._id, version: cart.version },
            {
              $set: { lines: [], updatedAt: now },
              $inc: { version: 1 },
            },
            { session },
          );
          if (cartResult.modifiedCount !== 1) {
            throw ApiError.conflict(
              "CART_CHANGED",
              "Cart changed while checkout was being committed",
            );
          }

          await this.outbox.insertOne(
            {
              _id: new ObjectId(),
              type: "order.confirmed",
              aggregateId: order._id.toHexString(),
              purchaserId: user.id,
              createdAt: now,
              availableAt: now,
              processedAt: null,
              attempts: 0,
            },
            { session },
          );

          return { order: mapOrder(order), replayed: false };
        }),
      );
      if (result === undefined) {
        throw new Error("Mongo transaction completed without a checkout result");
      }
      return result;
    } catch (error) {
      if (transactionUnsupported(error)) {
        throw ApiError.unavailable(
          "TRANSACTIONS_UNAVAILABLE",
          "Checkout requires MongoDB replica-set or sharded transaction support",
        );
      }
      if (duplicateKey(error)) {
        const replay = await this.existingOrder(user.id, keyHash);
        if (replay !== null) {
          const cart = await this.ensureCart(user.id);
          if (cart.lines.length === 0) {
            return { order: mapOrder(replay), replayed: true };
          }
          throw ApiError.conflict(
            "IDEMPOTENCY_KEY_REUSED",
            "Idempotency key already belongs to a completed checkout",
          );
        }
      }
      throw error;
    }
  }

  async listOrders(
    user: UserDto,
    query: { limit: number; offset: number },
  ): Promise<OrderListDto> {
    const filter = { purchaserId: user.id };
    const [documents, total] = await Promise.all([
      this.orders
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(query.offset)
        .limit(query.limit)
        .toArray(),
      this.orders.countDocuments(filter),
    ]);
    return {
      items: documents.map(mapOrder),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async getOrder(user: UserDto, orderId: string): Promise<OrderDto | null> {
    const _id = asObjectId(orderId);
    if (_id === null) return null;
    const filter: Document = { _id };
    if (user.role !== "admin") filter.purchaserId = user.id;
    const order = await this.orders.findOne(filter as never);
    return order === null ? null : mapOrder(order);
  }
}
