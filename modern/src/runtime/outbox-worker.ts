import { randomUUID } from "node:crypto";
import type { OutboxDeliveryService } from "../domain/outbox-delivery.js";

export type OutboxWorker = {
  start(): void;
  stop(): Promise<void>;
  isHealthy(): boolean;
};

export function createOutboxWorker(options: {
  delivery: OutboxDeliveryService;
  pollMs?: number;
  batchSize?: number;
  workerId?: string;
  onError?: (error: unknown) => void;
}): OutboxWorker {
  const pollMs = options.pollMs ?? 5_000;
  const batchSize = options.batchSize ?? 10;
  const workerId = options.workerId ?? `worker-${randomUUID()}`;
  let timer: NodeJS.Timeout | null = null;
  let stopped = true;
  let inFlight: Promise<void> | null = null;
  let lastCycleFailed = false;

  const schedule = () => {
    if (stopped) return;
    timer = setTimeout(() => {
      timer = null;
      inFlight = cycle().finally(() => {
        inFlight = null;
        schedule();
      });
    }, pollMs);
    timer.unref();
  };

  const cycle = async () => {
    try {
      for (let index = 0; index < batchSize; index += 1) {
        const result = await options.delivery.deliverNext(workerId);
        if (result === "idle") break;
      }
      lastCycleFailed = false;
    } catch (error) {
      lastCycleFailed = true;
      options.onError?.(error);
    }
  };

  return {
    start() {
      if (!stopped) return;
      stopped = false;
      inFlight = cycle().finally(() => {
        inFlight = null;
        schedule();
      });
    },

    async stop() {
      stopped = true;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      await inFlight;
    },

    isHealthy() {
      return !lastCycleFailed;
    },
  };
}
