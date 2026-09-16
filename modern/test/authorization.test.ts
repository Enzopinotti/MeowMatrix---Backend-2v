import { describe, expect, it } from "vitest";
import { ApiError } from "../src/api/errors.js";
import type { UserDto } from "../src/api/contracts.js";
import {
  requireOwnerOrAdmin,
  requireRole,
} from "../src/security/authorization.js";

const user: UserDto = {
  id: "user-1",
  name: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  role: "user",
  avatarUrl: null,
};

const admin: UserDto = { ...user, id: "admin-1", role: "admin" };

describe("authorization policy", () => {
  it("permits only explicitly allowed roles", () => {
    expect(() => requireRole(admin, ["admin"])).not.toThrow();
    expect(() => requireRole(user, ["admin"])).toThrowError(ApiError);
  });

  it("permits resource owners and admins but rejects unrelated users", () => {
    expect(() => requireOwnerOrAdmin(user, "user-1")).not.toThrow();
    expect(() => requireOwnerOrAdmin(admin, "user-1")).not.toThrow();
    expect(() => requireOwnerOrAdmin(user, "user-2")).toThrowError(ApiError);
  });
});
