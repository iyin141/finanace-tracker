import { NextRequest, NextResponse } from "next/server";
import { clearAuthResponse } from "@/_lib/auth";

export async function POST(req: NextRequest) {
  try {
    return clearAuthResponse({ message: "Logged out successfully." }, 200);
  } catch (err: any) {
    console.error("[POST /api/auth/logout]", err);
    return NextResponse.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}
