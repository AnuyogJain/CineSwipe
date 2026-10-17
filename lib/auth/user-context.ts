import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { getSessionUser } from "./session";

const userStorage = new AsyncLocalStorage<string>();

export function requestUserId(): string {
  const id = userStorage.getStore();
  if (!id) {
    throw new Error("User context missing — wrap the route in runWithUserSession()");
  }
  return id;
}

export function optionalUserId(): string | null {
  return userStorage.getStore() ?? null;
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Bind the logged-in user's id for library/taste DB queries. */
export async function runWithUserSession<T>(fn: () => Promise<T>): Promise<T> {
  const user = await getSessionUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return userStorage.run(user.id, fn);
}
