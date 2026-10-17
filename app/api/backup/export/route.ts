import { exportUserBackupCsvAsync } from "@/lib/backup/cineswipe-csv";
import { withUser } from "@/lib/api/run-with-user";

export const GET = withUser(async () => {
  const csv = await exportUserBackupCsvAsync();
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cineswipe-backup.csv"',
    },
  });
});
