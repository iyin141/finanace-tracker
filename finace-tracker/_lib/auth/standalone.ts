import { createAuthServer } from "@neondatabase/auth/server";

/** Resolves the current deployment's origin without a hardcoded APP_URL. */
function resolveOrigin(): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  // Vercel injects VERCEL_URL (host only, no protocol) at build & runtime.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Auth client for standalone scripts (seed, migrations) that run outside a
 * live Next.js request, so `next/headers` isn't available. No session cookie
 * handling is needed here — the seed script only creates accounts and reads
 * back their ids, it doesn't need to persist a browser session.
 */
export const standaloneAuth = createAuthServer({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookieSecret: process.env.NEON_AUTH_COOKIE_SECRET!,
  context: () => ({
    getCookies: () => "",
    setCookie: () => {},
    getHeader: () => null,
    getOrigin: resolveOrigin,
    getFramework: () => "node-script",
  }),
});
