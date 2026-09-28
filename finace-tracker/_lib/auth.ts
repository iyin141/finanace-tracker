import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import "dotenv/config";



let remoteJwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

function getJwks() {
  if (!remoteJwks) {
    remoteJwks = jose.createRemoteJWKSet(new URL(process.env.JWKS_URL || ''));
  }
  return remoteJwks;
}

export interface AuthUser {
  sub: string;
  uid?: string;
  email?: string;
  name?: string;
  role?: "admin" | "member";
}

/**
 * Verifies the Bearer token from the request Authorization header or HttpOnly cookie.
 * Returns the decoded payload or null if invalid / missing.
 */
export async function verifyAuth(req: NextRequest): Promise<AuthUser | null> {
  try {
    // Try Authorization header first
    let token = req.headers.get("authorization")?.replace("Bearer ", "");

    // Fall back to HttpOnly cookie
    if (!token) {
      token = req.cookies.get("auth_token")?.value;
    }

    if (!token) return null;

    const { payload } = await jose.jwtVerify(token, getJwks());

    return {
      sub: payload.sub as string,
      uid: payload.uid as string | undefined,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Builds HttpOnly cookie header for JWT token
 */
export function buildCookieHeader(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `auth_token=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
    `Max-Age=${60 * 60 * 24 * 30}`, // 30 days
  ];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}

/**
 * Creates a response with auth cookie set
 */
export function createAuthResponse(data: any, token: string, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  response.headers.set("Set-Cookie", buildCookieHeader(token));
  return response;
}

/**
 * Creates a response that clears auth cookie
 */
export function clearAuthResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  response.headers.set(
    "Set-Cookie",
    "auth_token=; Path=/; SameSite=Strict; Max-Age=0; HttpOnly" + (process.env.NODE_ENV === "production" ? "; Secure" : "")
  );
  return response;
}

/**
 * Login with Neon Auth API
 */
export async function loginWithNeonAuth(email: string, password: string): Promise<{ token: string; user: any } | null> {
 
  try {
    console.log("Logging in with Neon Auth:", email); 
    const response = await fetch(`${process.env.NEON_AUTH_URL}/sign-in/email`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Origin": process.env.APP_URL!, // e.g. http://localhost:3000 in dev
  },
  credentials: "include",
  body: JSON.stringify({ email, password }),
});
const data_2 = await response.json();
console.log("Neon Auth response body:", data_2);

    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return {
      token: data.token || data.access_token,
      user: data.user || { email, name: email.split("@")[0] },
    };
  } catch (error) {
    console.error("Neon Auth login error:", error);
    return null;
  }
}

/**
 * For development: returns a mock user so routes still work without auth.
 * Remove or gate this in production.
 */
export function getMockUser(): AuthUser {
  return { sub: "mock-user-id", uid: "mock-uid-001", email: "user@home.local", name: "Household Admin" };
}
