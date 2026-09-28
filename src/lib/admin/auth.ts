import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Minimal single-password admin auth.
 *
 * - ADMIN_PASSWORD enables the admin area; without it nothing admin-related works.
 * - Sessions are an HMAC-signed, HTTP-only, Secure, SameSite=Lax cookie scoped to /admin, valid 12 hours.
 * - The signing key is ADMIN_SESSION_SECRET, or derived from ADMIN_PASSWORD (so changing the
 *   password logs everyone out).
 */

export const SESSION_COOKIE = "add_admin_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60;

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0);
}

function signingKey(): Buffer {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit) return createHash("sha256").update(explicit).digest();
  return createHmac("sha256", "africa-drug-db/admin-session/v1").update(process.env.ADMIN_PASSWORD ?? "").digest();
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  // Hash first so inputs of different lengths still compare in constant time.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(input, expected);
}

export function createSessionToken(now = Date.now()): string {
  const expires = now + SESSION_TTL_SECONDS * 1000;
  const payload = `v1.${expires}.${randomBytes(16).toString("base64url")}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  if (!token || !isAdminConfigured()) return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;
  const payload = parts.slice(0, 3).join(".");
  if (!safeEqual(sign(payload), parts[3])) return false;
  const expires = Number(parts[1]);
  return Number.isFinite(expires) && expires > now;
}

export async function setSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/admin",
    maxAge: 0,
  });
}

export async function isAdmin(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

export class AdminNotConfiguredError extends Error {
  constructor() {
    super("Admin is not configured");
  }
}

/**
 * Guard for every admin page, server action and route handler.
 * Throws when admin is not configured; redirects to the login page when not signed in.
 */
export async function requireAdmin(): Promise<void> {
  if (!isAdminConfigured()) throw new AdminNotConfiguredError();
  if (!(await isAdmin())) redirect("/admin/login");
}

// --- Brute-force slowdown -------------------------------------------------
// Per-instance memory only (serverless instances are short-lived), combined with a
// fixed delay on every failure. Good enough to make online guessing slow.
const failures = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;

export async function clientKey(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

export async function penalizeFailure(key: string): Promise<void> {
  const now = Date.now();
  const entry = failures.get(key);
  const current = entry && now - entry.first < WINDOW_MS ? entry : { count: 0, first: now };
  current.count += 1;
  failures.set(key, current);
  if (failures.size > 5000) failures.clear();
  const delay = Math.min(1000 + 500 * (current.count - 1), 8000) + Math.floor(Math.random() * 300);
  await new Promise((r) => setTimeout(r, delay));
}

export function resetFailures(key: string) {
  failures.delete(key);
}
