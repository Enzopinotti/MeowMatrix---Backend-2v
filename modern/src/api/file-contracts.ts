import { ContractValidationError, type ApiErrorDetail } from "./contracts.js";

export const privateFilePurposes = [
  "avatar",
  "premium-identification",
  "premium-address",
  "premium-bank-statement",
] as const;

export type PrivateFilePurpose = (typeof privateFilePurposes)[number];
export type PrivateFileStatus = "staging" | "active" | "deleting" | "deleted";

export type PrivateFileDto = {
  id: string;
  ownerId: string;
  purpose: PrivateFilePurpose;
  originalName: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  bytes: number;
  sha256: string;
  createdAt: string;
};

export type PrivateFileListDto = {
  items: readonly PrivateFileDto[];
};

function validation(field: string, message: string): never {
  const details: ApiErrorDetail[] = [{ field, message }];
  throw new ContractValidationError("Request validation failed", details);
}

export function parsePrivateFilePurpose(value: string | undefined): PrivateFilePurpose {
  if (!value || !privateFilePurposes.includes(value as PrivateFilePurpose)) {
    return validation(
      "purpose",
      `Expected one of: ${privateFilePurposes.join(", ")}`,
    );
  }
  return value as PrivateFilePurpose;
}

export function parsePrivateFileId(value: string | undefined): string {
  if (!value || !/^[a-f0-9]{24}$/i.test(value)) {
    return validation("fileId", "Expected a Mongo ObjectId");
  }
  return value.toLowerCase();
}

export function parseOptionalOwnerId(value: unknown): string | null {
  if (value === undefined) return null;
  if (typeof value !== "string" || !/^[a-f0-9]{24}$/i.test(value)) {
    return validation("ownerId", "Expected a Mongo ObjectId");
  }
  return value.toLowerCase();
}
