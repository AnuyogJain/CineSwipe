import { NextResponse } from "next/server";
import { withUser } from "@/lib/api/run-with-user";
import {
  importUserBackupCsvReplace,
  MAX_BACKUP_BYTES,
} from "@/lib/backup/cineswipe-csv";

export const POST = withUser(async (request: Request) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file required" }, { status: 400 });
    }
    if (file.size > MAX_BACKUP_BYTES) {
      return NextResponse.json({ error: "Backup file too large" }, { status: 400 });
    }
    const csvText = await file.text();
    await importUserBackupCsvReplace(csvText);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
