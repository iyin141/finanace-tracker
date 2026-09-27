import { NextRequest } from "next/server";
import * as jose from "jose";

const JWKS_URL =
  "https://ep-red-mountain-b4lbh23r.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json";

let remoteJwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

function getJwks() {
  if (!remoteJwks) {
    remoteJwks = jose.createRemoteJWKSet(new URL(JWKS_URL));
  }
  return remoteJwks;
}

export interface AuthUser {
  sub: string;
  email?: string;
  name?: string;
}

/**
 * Verifies the Bearer token from the request Authorization header.
 * Returns the decoded payload or null if invalid / missing.
 */
export async function verifyAuth(req: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return null;

    const token = authHeader.slice(7);
    const { payload } = await jose.jwtVerify(token, getJwks());

    return {
      sub: payload.sub as string,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * For development: returns a mock user so routes still work without auth.
 * Remove or gate this in production.
 */
export function getMockUser(): AuthUser {
  return { sub: "mock-user-id", email: "user@home.local", name: "Household Admin" };
}
