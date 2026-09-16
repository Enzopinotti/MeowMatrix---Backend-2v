import type { OrderDto } from "../api/contracts.js";

export type ClaimedOutboxEvent = {
  id: string;
  type: string;
  aggregateId: string;
  purchaserId: string;
  attempts: number;
};

export type OrderConfirmation = {
  email: string;
  name: string;
  order: OrderDto;
};

export interface OutboxDeliveryRepository {
  claim(options: {
    workerId: string;
    now: number;
    leaseMs: number;
    maxAttempts: number;
  }): Promise<ClaimedOutboxEvent | null>;
  complete(eventId: string, workerId: string, now: number): Promise<void>;
  fail(options: {
    eventId: string;
    workerId: string;
    now: number;
    nextAvailableAt: number;
    terminal: boolean;
    errorCode: string;
  }): Promise<void>;
}

export interface OrderConfirmationSource {
  load(purchaserId: string, orderId: string): Promise<OrderConfirmation | null>;
}

export interface OrderConfirmationNotifier {
  send(input: OrderConfirmation): Promise<void>;
}

export type OutboxDeliveryService = {
  deliverNext(workerId: string, now?: number): Promise<"idle" | "delivered" | "retry" | "dead-letter">;
};

function retryDelayMs(attempts: number): number {
  const base = 30_000;
  return Math.min(60 * 60 * 1000, base * 2 ** Math.max(0, attempts - 1));
}

function safeErrorCode(error: unknown): string {
  const name = error instanceof Error ? error.name : "UnknownError";
  return name.replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 80) || "DeliveryError";
}

export function createOutboxDeliveryService(options: {
  repository: OutboxDeliveryRepository;
  orderSource: OrderConfirmationSource;
  notifier: OrderConfirmationNotifier;
  leaseMs?: number;
  maxAttempts?: number;
}): OutboxDeliveryService {
  const leaseMs = options.leaseMs ?? 30_000;
  const maxAttempts = options.maxAttempts ?? 6;

  return {
    async deliverNext(workerId, now = Date.now()) {
      const event = await options.repository.claim({
        workerId,
        now,
        leaseMs,
        maxAttempts,
      });
      if (event === null) return "idle";

      if (event.type !== "order.confirmed") {
        await options.repository.fail({
          eventId: event.id,
          workerId,
          now,
          nextAvailableAt: now,
          terminal: true,
          errorCode: "UnsupportedEventType",
        });
        return "dead-letter";
      }

      const confirmation = await options.orderSource.load(
        event.purchaserId,
        event.aggregateId,
      );
      if (confirmation === null) {
        await options.repository.fail({
          eventId: event.id,
          workerId,
          now,
          nextAvailableAt: now,
          terminal: true,
          errorCode: "OrderConfirmationSourceMissing",
        });
        return "dead-letter";
      }

      try {
        await options.notifier.send(confirmation);
        await options.repository.complete(event.id, workerId, Date.now());
        return "delivered";
      } catch (error) {
        const terminal = event.attempts >= maxAttempts;
        const failedAt = Date.now();
        await options.repository.fail({
          eventId: event.id,
          workerId,
          now: failedAt,
          nextAvailableAt: failedAt + retryDelayMs(event.attempts),
          terminal,
          errorCode: safeErrorCode(error),
        });
        return terminal ? "dead-letter" : "retry";
      }
    },
  };
}
