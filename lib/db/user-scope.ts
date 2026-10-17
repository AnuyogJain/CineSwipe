import "server-only";

import { eq, type SQL } from "drizzle-orm";
import { requestUserId } from "@/lib/auth/user-context";
import { importedRatings, swipeActions, tasteProfile } from "./schema";

type UserTable =
  | typeof importedRatings
  | typeof swipeActions
  | typeof tasteProfile;

export function forUser(table: UserTable): SQL {
  return eq(table.userId, requestUserId());
}
