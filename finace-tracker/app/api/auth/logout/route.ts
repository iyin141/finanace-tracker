import { NextResponse } from "next/server";
import { auth } from "@/_lib/auth/server";

export async function POST() {
  try {
    await auth.signOut();
    return NextResponse.json({ message: "Logged out successfully." });
  } catch (err: any) {
    console.error("[POST /api/auth/logout]", err);
    return NextResponse.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}
