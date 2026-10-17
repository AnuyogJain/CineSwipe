import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withUser } from "@/lib/api/run-with-user";
import { requestUserId } from "@/lib/auth/user-context";
import { db } from "@/lib/db";
import { userBackups } from "@/lib/db/schema";

export const GET = withUser(async () => {
  const userId = requestUserId();
  const rows = await db
    .select()
    .from(userBackups)
    .where(eq(userBackups.userId, userId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return NextResponse.json(
      { error: "No server backup found" },
      { status: 404 },
    );
  }

  return new Response(row.payload, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cineswipe-backup-server.csv"',
    },
  });
});
