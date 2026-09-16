import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

const KEY_LENGTH = 64;
const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const MAX_MEMORY = 64 * 1024 * 1024;
const VERSION = "v1";
const LEGACY_BCRYPT = /^\$2[aby]\$/;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: MAX_MEMORY },
      (error, key) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(key);
      },
    );
  });
}

export function assertPasswordPolicy(password: string): void {
  if (password.length < 12 || password.length > 128) {
    throw new Error("Password must contain between 12 and 128 characters");
  }
}

export async function hashPassword(password: string): Promise<string> {
  assertPasswordPolicy(password);
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return [
    "scrypt",
    VERSION,
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

async function verifyScryptPassword(
  password: string,
  encodedHash: string,
): Promise<boolean> {
  const parts = encodedHash.split("$");
  if (parts.length !== 7 || parts[0] !== "scrypt" || parts[1] !== VERSION) {
    return false;
  }

  const [n, r, p] = parts.slice(2, 5).map(Number);
  if (n !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P) {
    return false;
  }

  try {
    const salt = Buffer.from(parts[5] ?? "", "base64url");
    const expected = Buffer.from(parts[6] ?? "", "base64url");
    if (salt.length !== 16 || expected.length !== KEY_LENGTH) {
      return false;
    }
    const actual = await derive(password, salt);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function isLegacyBcryptHash(encodedHash: string): boolean {
  return LEGACY_BCRYPT.test(encodedHash);
}

export function passwordHashNeedsUpgrade(encodedHash: string): boolean {
  return isLegacyBcryptHash(encodedHash);
}

export async function verifyPassword(
  password: string,
  encodedHash: string,
): Promise<boolean> {
  if (isLegacyBcryptHash(encodedHash)) {
    try {
      return await bcrypt.compare(password, encodedHash);
    } catch {
      return false;
    }
  }

  return verifyScryptPassword(password, encodedHash);
}

export const passwordHashPolicy = Object.freeze({
  algorithm: "scrypt",
  version: VERSION,
  N: SCRYPT_N,
  r: SCRYPT_R,
  p: SCRYPT_P,
  saltBytes: 16,
  keyBytes: KEY_LENGTH,
  minimumPasswordLength: 12,
  maximumPasswordLength: 128,
  legacyAlgorithmsAcceptedForLogin: ["bcrypt"] as const,
});
