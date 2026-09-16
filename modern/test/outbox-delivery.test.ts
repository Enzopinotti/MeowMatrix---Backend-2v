import { describe, expect, it, vi } from "vitest";
import {
  createOutboxDeliveryService,
  type ClaimedOutboxEvent,
  type OrderConfirmationSource,
  type OutboxDeliveryRepository,
} from "../src/domain/outbox-delivery.js";

const confirmation = {
  email: "buyer@example.test",
  name: "Buyer",
  order: {
    id: "aaaaaaaaaaaaaaaaaaaaaaaa",
    code: "MM-2026-0001",
    purchaserId: "bbbbbbbbbbbbbbbbbbbbbbbb",
    status: "confirmed" as const,
    lines: [
      {
        productId: "cccccccccccccccccccccccc",
        name: "Product",
        unitPrice: 10,
        quantity: 2,
        lineTotal: 20,
      },
    ],
    total: 20,
    createdAt: new Date(0).toISOString(),
  },
};

function event(overrides: Partial<ClaimedOutboxEvent> = {}): ClaimedOutboxEvent {
  return {
    id: "dddddddddddddddddddddddd",
    type: "order.confirmed",
    aggregateId: confirmation.order.id,
    purchaserId: confirmation.order.purchaserId,
    attempts: 1,
    ...overrides,
  };
}

function harness(claimed: ClaimedOutboxEvent | null = event()) {
  const complete = vi.fn(async () => undefined);
  const fail = vi.fn(async () => undefined);
  const repository: OutboxDeliveryRepository = {
    claim: vi.fn(async () => claimed),
    complete,
    fail,
  };
  const source: OrderConfirmationSource = {
    load: vi.fn(async () => confirmation),
  };
  const send = vi.fn(async () => undefined);
  const service = createOutboxDeliveryService({
    repository,
    orderSource: source,
    notifier: { send },
    leaseMs: 30_000,
    maxAttempts: 6,
  });
  return { service, repository, source, send, complete, fail };
}

describe("B5 outbox delivery", () => {
  it("marks a confirmed order delivered only after notifier success", async () => {
    const { service, send, complete, fail } = harness();
    await expect(service.deliverNext("worker-a", 1_000)).resolves.toBe("delivered");
    expect(send).toHaveBeenCalledWith(confirmation);
    expect(complete).toHaveBeenCalledWith(
      "dddddddddddddddddddddddd",
      "worker-a",
      expect.any(Number),
    );
    expect(fail).not.toHaveBeenCalled();
  });

  it("schedules bounded retry after notifier failure without persisting raw SMTP errors", async () => {
    const { service, send, fail } = harness(event({ attempts: 2 }));
    send.mockRejectedValueOnce(Object.assign(new Error("secret smtp detail"), { name: "ECONNECTION SMTP password=hidden" }));

    await expect(service.deliverNext("worker-a", 10_000)).resolves.toBe("retry");
    expect(fail).toHaveBeenCalledTimes(1);
    const call = fail.mock.calls[0]?.[0];
    expect(call?.terminal).toBe(false);
    expect(call?.nextAvailableAt).toBeGreaterThan(call?.now ?? 0);
    expect(call?.errorCode).toMatch(/^[A-Za-z0-9_.-]{1,80}$/);
    expect(call?.errorCode).not.toContain("password");
    expect(JSON.stringify(call)).not.toContain("secret smtp detail");
  });

  it("dead-letters poison events and missing aggregate sources", async () => {
    const unsupported = harness(event({ type: "unknown.event" }));
    await expect(unsupported.service.deliverNext("worker-a", 1_000)).resolves.toBe(
      "dead-letter",
    );
    expect(unsupported.send).not.toHaveBeenCalled();
    expect(unsupported.fail).toHaveBeenCalledWith(
      expect.objectContaining({ terminal: true, errorCode: "UnsupportedEventType" }),
    );

    const missing = harness();
    vi.mocked(missing.source.load).mockResolvedValueOnce(null);
    await expect(missing.service.deliverNext("worker-a", 1_000)).resolves.toBe(
      "dead-letter",
    );
    expect(missing.send).not.toHaveBeenCalled();
    expect(missing.fail).toHaveBeenCalledWith(
      expect.objectContaining({
        terminal: true,
        errorCode: "OrderConfirmationSourceMissing",
      }),
    );
  });

  it("dead-letters the final configured delivery attempt", async () => {
    const { service, send, fail } = harness(event({ attempts: 6 }));
    send.mockRejectedValueOnce(new Error("temporary"));
    await expect(service.deliverNext("worker-a", 1_000)).resolves.toBe("dead-letter");
    expect(fail).toHaveBeenCalledWith(expect.objectContaining({ terminal: true }));
  });

  it("propagates lease persistence loss instead of falsely reporting delivery", async () => {
    const { service, complete } = harness();
    complete.mockRejectedValueOnce(new Error("Outbox delivery lease was lost before completion"));
    await expect(service.deliverNext("worker-a", 1_000)).rejects.toThrow(/lease was lost/i);
  });

  it("is idle without claiming side effects when no event is available", async () => {
    const { service, send, complete, fail } = harness(null);
    await expect(service.deliverNext("worker-a", 1_000)).resolves.toBe("idle");
    expect(send).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
    expect(fail).not.toHaveBeenCalled();
  });
});
