import { NextResponse } from "next/server";
import { seedDatabase } from "@/_lib/seed/seedDatabase";

/**
 * POST /api/seed
 * Seeds the database with real Neon Auth accounts, categories, and sample expenses.
 */
export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({
      message: "Database seeded successfully!",
      ...result,
    });
  } catch (err: any) {
    console.error("[POST /api/seed]", err);
    return NextResponse.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}
