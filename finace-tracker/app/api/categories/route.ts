import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/_lib/typeorm";
import { Category } from "@/_lib/entities/Category";
import { BUDGET_CATEGORIES } from "@/_lib/utils";

export async function GET() {
  try {
    const dataSource = await getDataSource();
    const repo = dataSource.getRepository(Category);
    const categories = await repo.find({ order: { name: "ASC" } });
    return NextResponse.json({ data: categories }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, budgetAmount, color } = await req.json();
    if (!name) return NextResponse.json({ message: "Name is required." }, { status: 400 });

    const dataSource = await getDataSource();
    const repo = dataSource.getRepository(Category);

    const existing = await repo.findOneBy({ name });
    if (existing) return NextResponse.json({ message: "Category already exists." }, { status: 409 });

    const category = repo.create({
      name,
      budgetAmount: budgetAmount ?? 0,
      color: color ?? "#10b981",
    });
    await repo.save(category);
    return NextResponse.json({ data: category }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}

/**
 * POST /api/categories/seed
 * Seeds default categories from BUDGET_CATEGORIES if not already present.
 */
export async function PUT() {
  try {
    const dataSource = await getDataSource();
    const repo = dataSource.getRepository(Category);
    const results: Category[] = [];

    for (const bc of BUDGET_CATEGORIES) {
      let cat = await repo.findOneBy({ name: bc.name });
      if (!cat) {
        cat = repo.create({ name: bc.name, budgetAmount: bc.budget, color: bc.color });
        await repo.save(cat);
      }
      results.push(cat);
    }
    return NextResponse.json({ data: results, message: "Seeded." }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}
