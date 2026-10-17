import { z } from "zod";
import { normalizeUsername } from "./constants";

export const registerSchema = z.object({
  displayName: z.string().trim().min(1).max(64),
  username: z
    .string()
    .trim()
    .transform(normalizeUsername)
    .pipe(z.string().min(1, { message: "Username required" }).max(64)),
  password: z
    .string()
    .min(8, { message: "At least 8 characters" })
    .max(128),
});

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .transform(normalizeUsername)
    .pipe(z.string().min(1, { message: "Username required" }).max(64)),
  password: z.string().min(1).max(128),
});
