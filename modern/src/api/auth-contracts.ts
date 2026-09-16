import { ContractValidationError, type UserDto } from "./contracts.js";

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  lastName: string;
  email: string;
  password: string;
};

export type PasswordResetRequest = {
  email: string;
};

export type PasswordResetConfirmRequest = {
  token: string;
  password: string;
};

export type AuthSessionDto = {
  user: UserDto;
  expiresAt: string;
};

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ContractValidationError([
      { field: "body", message: "Expected a JSON object" },
    ]);
  }
  return value as Record<string, unknown>;
}

function stringField(
  input: Record<string, unknown>,
  field: string,
  minimum: number,
  maximum: number,
): string {
  const value = input[field];
  if (typeof value !== "string") {
    throw new ContractValidationError([
      { field, message: "Expected a string" },
    ]);
  }
  const trimmed = field === "password" ? value : value.trim();
  if (trimmed.length < minimum || trimmed.length > maximum) {
    throw new ContractValidationError([
      {
        field,
        message: `Expected between ${minimum} and ${maximum} characters`,
      },
    ]);
  }
  return trimmed;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function emailField(input: Record<string, unknown>): string {
  const email = normalizeEmail(stringField(input, "email", 3, 254));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ContractValidationError([
      { field: "email", message: "Expected a valid email address" },
    ]);
  }
  return email;
}

function passwordField(input: Record<string, unknown>): string {
  return stringField(input, "password", 12, 128);
}

export function parseLoginRequest(value: unknown): LoginRequest {
  const input = record(value);
  return {
    email: emailField(input),
    password: passwordField(input),
  };
}

export function parseRegisterRequest(value: unknown): RegisterRequest {
  const input = record(value);
  return {
    name: stringField(input, "name", 1, 80),
    lastName: stringField(input, "lastName", 1, 80),
    email: emailField(input),
    password: passwordField(input),
  };
}

export function parsePasswordResetRequest(value: unknown): PasswordResetRequest {
  const input = record(value);
  return { email: emailField(input) };
}

export function parsePasswordResetConfirmRequest(
  value: unknown,
): PasswordResetConfirmRequest {
  const input = record(value);
  const token = stringField(input, "token", 40, 128);
  if (!/^[A-Za-z0-9_-]+$/.test(token)) {
    throw new ContractValidationError([
      { field: "token", message: "Expected a valid reset token" },
    ]);
  }
  return { token, password: passwordField(input) };
}
