import { createAuthServer } from "@neondatabase/auth/server";

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
    getOrigin: () => process.env.APP_URL || "http://localhost:3000",
    getFramework: () => "node-script",
  }),
});
