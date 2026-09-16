import { ObjectId, type Collection, type Db, type Document } from "mongodb";
import type {
  ClaimedOutboxEvent,
  OrderConfirmationSource,
  OutboxDeliveryRepository,
} from "../domain/outbox-delivery.js";
import type { OrderDto } from "../api/contracts.js";

type OutboxDocument = {
  _id: ObjectId;
  type: string;
  aggregateId: string;
  purchaserId: string;
  createdAt: Date;
  availableAt: Date;
  processedAt: Date | null;
  failedAt?: Date | null;
  attempts: number;
  leaseOwner?: string;
  leaseExpiresAt?: Date;
  lastErrorCode?: string;
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
  createdAt: Date;
};

function mapClaim(document: OutboxDocument): ClaimedOutboxEvent {
  return {
    id: document._id.toHexString(),
    type: document.type,
    aggregateId: document.aggregateId,
    purchaserId: document.purchaserId,
    attempts: document.attempts,
  };
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

export async function ensureOutboxDeliveryIndexes(db: Db): Promise<void> {
  await db.collection<OutboxDocument>("commerce_outbox").createIndex(
    {
      processedAt: 1,
      failedAt: 1,
      availableAt: 1,
      leaseExpiresAt: 1,
      createdAt: 1,
    },
    { name: "commerce_outbox_delivery_claim" },
  );
}

export class MongoOutboxDeliveryRepository implements OutboxDeliveryRepository {
  private readonly events: Collection<OutboxDocument>;

  constructor(db: Db) {
    this.events = db.collection<OutboxDocument>("commerce_outbox");
  }

  async claim(options: {
    workerId: string;
    now: number;
    leaseMs: number;
    maxAttempts: number;
  }): Promise<ClaimedOutboxEvent | null> {
    const now = new Date(options.now);
    const document = await this.events.findOneAndUpdate(
      {
        processedAt: null,
        $or: [{ failedAt: { $exists: false } }, { failedAt: null }],
        availableAt: { $lte: now },
        attempts: { $lt: options.maxAttempts },
        $and: [
          {
            $or: [
              { leaseExpiresAt: { $exists: false } },
              { leaseExpiresAt: { $lte: now } },
            ],
          },
        ],
      },
      {
        $set: {
          leaseOwner: options.workerId,
          leaseExpiresAt: new Date(options.now + options.leaseMs),
        },
        $inc: { attempts: 1 },
      },
      { sort: { createdAt: 1 }, returnDocument: "after" },
    );
    return document === null ? null : mapClaim(document);
  }

  async complete(
    eventId: string,
    workerId: string,
    now: number,
  ): Promise<void> {
    if (!ObjectId.isValid(eventId)) {
      throw new Error("Outbox event id is invalid");
    }
    const result = await this.events.updateOne(
      { _id: new ObjectId(eventId), leaseOwner: workerId, processedAt: null },
      {
        $set: { processedAt: new Date(now) },
        $unset: { leaseOwner: "", leaseExpiresAt: "", lastErrorCode: "" },
      },
    );
    if (result.matchedCount !== 1) {
      throw new Error("Outbox delivery lease was lost before completion");
    }
  }

  async fail(options: {
    eventId: string;
    workerId: string;
    now: number;
    nextAvailableAt: number;
    terminal: boolean;
    errorCode: string;
  }): Promise<void> {
    if (!ObjectId.isValid(options.eventId)) {
      throw new Error("Outbox event id is invalid");
    }
    const terminalFields = options.terminal
      ? { failedAt: new Date(options.now), lastErrorCode: options.errorCode }
      : {
          availableAt: new Date(options.nextAvailableAt),
          lastErrorCode: options.errorCode,
        };
    const result = await this.events.updateOne(
      {
        _id: new ObjectId(options.eventId),
        leaseOwner: options.workerId,
        processedAt: null,
      },
      {
        $set: terminalFields,
        $unset: { leaseOwner: "", leaseExpiresAt: "" },
      },
    );
    if (result.matchedCount !== 1) {
      throw new Error(
        "Outbox delivery lease was lost before failure state persisted",
      );
    }
  }
}

export class MongoOrderConfirmationSource implements OrderConfirmationSource {
  private readonly users: Collection<Document>;
  private readonly orders: Collection<OrderDocument>;

  constructor(db: Db) {
    this.users = db.collection("users");
    this.orders = db.collection<OrderDocument>("commerce_orders");
  }

  async load(purchaserId: string, orderId: string) {
    if (!ObjectId.isValid(orderId)) return null;
    const [user, order] = await Promise.all([
      ObjectId.isValid(purchaserId)
        ? this.users.findOne({ _id: new ObjectId(purchaserId) })
        : Promise.resolve(null),
      this.orders.findOne({ _id: new ObjectId(orderId), purchaserId }),
    ]);
    if (
      user === null ||
      order === null ||
      typeof user.email !== "string" ||
      typeof user.name !== "string"
    ) {
      return null;
    }
    return {
      email: user.email.trim().toLowerCase(),
      name: user.name,
      order: mapOrder(order),
    };
  }
}
