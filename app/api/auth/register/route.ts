import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {
  checkAuthRateLimit,
  clientRateLimitKey,
} from "@/lib/auth/rate-limit";
import { insertEmptyTasteProfile } from "@/lib/auth/empty-taste";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { registerSchema } from "@/lib/auth/validation";
import { db } from "@/lib/db";
import { publicDbErrorMessage } from "@/lib/db/public-db-error";
import { users } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    if (!checkAuthRateLimit(`register:${clientRateLimitKey(request)}`)) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 },
      );
    }

    const json = await request.json();
    const parsed = registerSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { displayName, username, password } = parsed.data;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 },
      );
    }

    const id = randomUUID();
    const passwordHash = await hashPassword(password);
    await db.insert(users).values({
      id,
      displayName,
      username,
      passwordHash,
      createdAt: new Date(),
    });

    await insertEmptyTasteProfile(id);
    await createSession(id);

    return NextResponse.json({
      user: { id, displayName, username },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: publicDbErrorMessage(error, "Registration failed"),
      },
      { status: 400 },
    );
  }
}
