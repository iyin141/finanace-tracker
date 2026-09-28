import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/_lib/typeorm";
import { Expense } from "@/_lib/entities/Expense";
import { Category } from "@/_lib/entities/Category";
import { User } from "@/_lib/entities/User";
import { getSessionUser } from "@/_lib/auth";

/**
 * POST /api/upload
 * Accepts a JSON array of rows parsed from CSV:
 *   [{ date: string, amount: number, category: string, item: string }]
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getSessionUser();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    const rows: { date: string; amount: number; category: string; item: string }[] =
      await req.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ message: "No rows provided." }, { status: 400 });
    }

    const ds = await getDataSource();
    const expenseRepo  = ds.getRepository(Expense);
    const categoryRepo = ds.getRepository(Category);
    const userRepo     = ds.getRepository(User);

    // Get the logged-in user from database
    const user = await userRepo.findOneBy({ uid: authUser.id }) || await userRepo.findOneBy({ email: authUser.email });

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
        userId: authUser.id,
        loggedByUserId: user?.id || null,
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
