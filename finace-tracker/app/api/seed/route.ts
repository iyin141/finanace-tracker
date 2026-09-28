import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/_lib/typeorm";
import { User } from "@/_lib/entities/User";
import { Category } from "@/_lib/entities/Category";
import { Expense } from "@/_lib/entities/Expense";
import { BUDGET_CATEGORIES } from "@/_lib/utils";

/**
 * POST /api/seed
 * Seeds the database with initial users, categories, and sample expenses
 */
export async function POST(req: NextRequest) {
  try {
    const dataSource = await getDataSource();
    const userRepo = dataSource.getRepository(User);
    const categoryRepo = dataSource.getRepository(Category);
    const expenseRepo = dataSource.getRepository(Expense);

    // Seed Users
    console.log("👤 Seeding users...");
    const momUser = userRepo.create({
      uid: "mom-uid-001",
      email: "mom@household.local",
      name: "Mom",
      role: "admin",
    });
    await userRepo.save(momUser);

    const dadUser = userRepo.create({
      uid: "dad-uid-002",
      email: "dad@household.local",
      name: "Dad",
      role: "admin",
    });
    await userRepo.save(dadUser);

    // Seed Categories
    console.log("📁 Seeding categories...");
    for (const cat of BUDGET_CATEGORIES) {
      const existing = await categoryRepo.findOneBy({ name: cat.name });
      if (!existing) {
        const category = categoryRepo.create({
          name: cat.name,
          budgetAmount: cat.budget,
          color: cat.color,
        });
        await categoryRepo.save(category);
      }
    }

    // Seed Sample Expenses
    console.log("💰 Seeding sample expenses...");
    const categories = await categoryRepo.find();
    const meatCategory = categories.find(c => c.name === "Meat & Pepper");
    const groceriesCategory = categories.find(c => c.name === "Groceries");
    const fuelCategory = categories.find(c => c.name === "Fuel");

    if (meatCategory && groceriesCategory && fuelCategory) {
      const sampleExpenses = [
        {
          date: "2026-09-01",
          amount: 5000,
          item: "Chicken breast",
          userId: momUser.uid,
          comments: "From market - fresh stock",
          categoryId: meatCategory.id,
          loggedByUserId: momUser.id,
        },
        {
          date: "2026-09-05",
          amount: 12000,
          item: "Groceries - weekly stock",
          userId: dadUser.uid,
          comments: "Milk, bread, eggs, vegetables",
          categoryId: groceriesCategory.id,
          loggedByUserId: dadUser.id,
        },
        {
          date: "2026-09-10",
          amount: 15000,
          item: "Fuel refill",
          userId: dadUser.uid,
          comments: "Full tank for weekend trip",
          categoryId: fuelCategory.id,
          loggedByUserId: dadUser.id,
        },
        {
          date: "2026-09-15",
          amount: 8500,
          item: "Turkey and beef",
          userId: momUser.uid,
          comments: "For Sunday cooking",
          categoryId: meatCategory.id,
          loggedByUserId: momUser.id,
        },
        {
          date: "2026-09-20",
          amount: 9500,
          item: "Monthly groceries",
          userId: momUser.uid,
          comments: "Rice, beans, oil, spices",
          categoryId: groceriesCategory.id,
          loggedByUserId: momUser.id,
        },
      ];

      for (const expenseData of sampleExpenses) {
        const expense = expenseRepo.create(expenseData);
        await expenseRepo.save(expense);
      }
    }

    return NextResponse.json({
      message: "Database seeded successfully!",
      users: 2,
      categories: categories.length,
      expenses: 5,
    });
  } catch (err: any) {
    console.error("[POST /api/seed]", err);
    return NextResponse.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}
