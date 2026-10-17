import { NextResponse } from "next/server";
import { getApiKeys, maskKey, setApiKeys } from "@/lib/settings";
import { z } from "zod";

export async function GET() {
  const keys = await getApiKeys();
  return NextResponse.json({
    tmdbConfigured: Boolean(keys.tmdbApiKey),
    omdbConfigured: Boolean(keys.omdbApiKey),
    tmdbMasked: maskKey(keys.tmdbApiKey),
    omdbMasked: maskKey(keys.omdbApiKey),
  });
}

const bodySchema = z.object({
  tmdbApiKey: z.string().min(1).optional(),
  omdbApiKey: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
  }

  await setApiKeys(parsed.data);
  return NextResponse.json({ ok: true });
}
