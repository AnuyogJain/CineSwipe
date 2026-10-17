import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withUser } from "@/lib/api/run-with-user";
import { exportUserBackupCsvAsync } from "@/lib/backup/cineswipe-csv";
import { requestUserId } from "@/lib/auth/user-context";
import { db } from "@/lib/db";
import { userBackups } from "@/lib/db/schema";

export const POST = withUser(async () => {
  try {
    const userId = requestUserId();
    const payload = await exportUserBackupCsvAsync();
    const now = new Date();
    await db
      .insert(userBackups)
      .values({ userId, payload, uploadedAt: now })
      .onConflictDoUpdate({
        target: userBackups.userId,
        set: { payload, uploadedAt: now },
      });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Backup upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
