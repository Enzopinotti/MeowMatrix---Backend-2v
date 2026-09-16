import { ApiError } from "../api/errors.js";
import type { UserDto } from "../api/contracts.js";

export function requireRole(
  user: UserDto,
  allowedRoles: readonly UserDto["role"][],
): void {
  if (!allowedRoles.includes(user.role)) {
    throw new ApiError(403, "FORBIDDEN", "Insufficient permissions");
  }
}

export function requireOwnerOrAdmin(user: UserDto, ownerId: string): void {
  if (user.role === "admin" || user.id === ownerId) return;
  throw new ApiError(403, "FORBIDDEN", "Insufficient permissions");
}
