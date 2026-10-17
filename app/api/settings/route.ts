import { NextResponse } from "next/server";
import { z } from "zod";
import { withUser } from "@/lib/api/run-with-user";
import { demoApiKeysAvailable } from "@/lib/demo-api-keys";
import { getApiKeys, maskKey, setApiKeys } from "@/lib/settings";

export const GET = withUser(async () => {
  const keys = await getApiKeys();
  return NextResponse.json({
    tmdbConfigured: Boolean(keys.tmdbApiKey),
    omdbConfigured: Boolean(keys.omdbApiKey),
    tmdbMasked: maskKey(keys.tmdbApiKey),
    omdbMasked: maskKey(keys.omdbApiKey),
    demoKeysAvailable: demoApiKeysAvailable(),
  });
});

const bodySchema = z.object({
  tmdbApiKey: z.string().min(1).optional(),
  omdbApiKey: z.string().min(1).optional(),
});

export const POST = withUser(async (request: Request) => {
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
  }

  await setApiKeys(parsed.data);
  return NextResponse.json({ ok: true });
});
