import type { SessionUser } from "./session";
import { Role } from "@pe-smkk/shared";

/** Admin sees all; surveyor only own resources. */
export function canAccessOwned(
  user: SessionUser,
  ownerUserId: string,
): boolean {
  if (user.role === Role.ADMIN) return true;
  return user.id === ownerUserId;
}
