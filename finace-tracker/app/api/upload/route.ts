import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/_lib/typeorm";
import { Expense } from "@/_lib/entities/Expense";
import { Category } from "@/_lib/entities/Category";
import { getMockUser } from "@/_lib/auth";

/**
 * POST /api/upload
 * Accepts a JSON array of rows parsed from CSV:
 *   [{ date: string, amount: number, category: string, item: string }]
 */
export async function POST(req: NextRequest) {
  try {
    const user = getMockUser(); // swap to verifyAuth(req) in production
    const rows: { date: string; amount: number; category: string; item: string }[] =
      await req.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ message: "No rows provided." }, { status: 400 });
    }

    const ds = await getDataSource();
    const expenseRepo  = ds.getRepository(Expense);
    const categoryRepo = ds.getRepository(Category);

    const errors: string[] = [];
    const saved: Expense[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 1;

      if (!row.date || !row.amount || !row.category || !row.item) {
        errors.push(`Row ${lineNum}: missing required field (date, amount, category, item).`);
        continue;
      }

      // Look up or create category
      let category = await categoryRepo.findOneBy({ name: row.category.trim() });
      if (!category) {
        category = categoryRepo.create({
          name: row.category.trim(),
          budgetAmount: 0,
          color: "#6b7280",
        });
        await categoryRepo.save(category);
      }

      const expense = expenseRepo.create({
        date: row.date,
        amount: Number(row.amount),
        item: row.item.trim(),
        categoryId: category.id,
        userId: user.sub,
      });
      await expenseRepo.save(expense);
      saved.push(expense);
    }

    return NextResponse.json(
      { imported: saved.length, errors },
      { status: errors.length === rows.length ? 400 : 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/upload]", err);
    return NextResponse.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}
