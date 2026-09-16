import { mkdir, open, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import type { PrivateBlobStorage } from "../domain/private-files.js";

const STORAGE_KEY = /^[a-f0-9]{64}$/;

function assertStorageKey(storageKey: string): void {
  if (!STORAGE_KEY.test(storageKey)) {
    throw new Error("Invalid private storage key");
  }
}

export class FileSystemPrivateBlobStorage implements PrivateBlobStorage {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private filePath(storageKey: string): string {
    assertStorageKey(storageKey);
    return path.join(this.root, storageKey.slice(0, 2), storageKey);
  }

  async initialize(): Promise<void> {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
  }

  async put(storageKey: string, content: Buffer): Promise<void> {
    const target = this.filePath(storageKey);
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    const handle = await open(target, "wx", 0o600);
    try {
      await handle.writeFile(content);
      await handle.sync();
    } catch (error) {
      await handle.close().catch(() => undefined);
      await unlink(target).catch(() => undefined);
      throw error;
    }
    await handle.close();
  }

  async read(storageKey: string): Promise<Buffer | null> {
    try {
      return await readFile(this.filePath(storageKey));
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: unknown }).code === "ENOENT"
      ) {
        return null;
      }
      throw error;
    }
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await unlink(this.filePath(storageKey));
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: unknown }).code === "ENOENT"
      ) {
        return;
      }
      throw error;
    }
  }
}
