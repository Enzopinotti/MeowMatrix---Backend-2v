import type { PrivateFileService } from "../domain/private-files.js";

export type PrivateFileCleanupWorker = {
  start(): void;
  stop(): Promise<void>;
  isHealthy(): boolean;
};

export function createPrivateFileCleanupWorker(options: {
  files: PrivateFileService;
  pollMs?: number;
  onError?: (error: unknown) => void;
}): PrivateFileCleanupWorker {
  const pollMs = options.pollMs ?? 60_000;
  let timer: NodeJS.Timeout | null = null;
  let stopped = true;
  let inFlight: Promise<void> | null = null;
  let lastCycleFailed = false;

  const run = async () => {
    try {
      await options.files.recoverPendingDeletes();
      lastCycleFailed = false;
    } catch (error) {
      lastCycleFailed = true;
      options.onError?.(error);
    }
  };

  const schedule = () => {
    if (stopped) return;
    timer = setTimeout(() => {
      timer = null;
      inFlight = run().finally(() => {
        inFlight = null;
        schedule();
      });
    }, pollMs);
    timer.unref();
  };

  return {
    start() {
      if (!stopped) return;
      stopped = false;
      inFlight = run().finally(() => {
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
