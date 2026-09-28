import { getDataSource } from "../typeorm";
import { User } from "../entities/User";
import { Category } from "../entities/Category";
import { Expense } from "../entities/Expense";
import { BUDGET_CATEGORIES } from "../utils";

async function seedDatabase() {
  const dataSource = await getDataSource();
  const userRepo = dataSource.getRepository(User);
  const categoryRepo = dataSource.getRepository(Category);
  const expenseRepo = dataSource.getRepository(Expense);

  console.log("🌱 Starting database seed...");

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

  console.log("✅ Users seeded: Mom and Dad");

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
  console.log("✅ Categories seeded from budget template");

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
    console.log("✅ Sample expenses seeded");
  }

  console.log("🎉 Database seed completed successfully!");
  console.log("\n📋 Login credentials:");
  console.log("  Mom: mom@household.local (Password via Neon Auth)");
  console.log("  Dad: dad@household.local (Password via Neon Auth)");

  await dataSource.destroy();
}

// Run seed if executed directly
if (require.main === module) {
  seedDatabase().catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
}

export { seedDatabase };
