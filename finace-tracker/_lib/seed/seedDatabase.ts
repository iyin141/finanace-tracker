import { getDataSource } from "../typeorm";
import { User } from "../entities/User";
import { Category } from "../entities/Category";
import { Expense } from "../entities/Expense";
import { BUDGET_CATEGORIES } from "../utils";
import { standaloneAuth as auth } from "../auth/standalone";

interface SeedAccount {
  email: string;
  password: string;
  name: string;
}

function seedAccounts(): SeedAccount[] {
  const accounts: SeedAccount[] = [
    { email: process.env.SEED_IYIN_EMAIL!, password: process.env.SEED_IYIN_PASSWORD!, name: "Iyin" },
    { email: process.env.SEED_MOM_EMAIL!, password: process.env.SEED_MOM_PASSWORD!, name: "Mom" },
    { email: process.env.SEED_DAD_EMAIL!, password: process.env.SEED_DAD_PASSWORD!, name: "Dad" },
  ];
  const missing = accounts.filter((a) => !a.email || !a.password);
  if (missing.length > 0) {
    throw new Error(
      "Missing SEED_*_EMAIL / SEED_*_PASSWORD env vars for one or more accounts. Set them in .env.local."
    );
  }
  return accounts;
}

/** Creates the Neon Auth account if it doesn't exist yet, otherwise signs in to recover its id. */
async function ensureAuthUser(account: SeedAccount) {
  const signUpResult = await auth.signUp.email({
    email: account.email,
    password: account.password,
    name: account.name,
  });
  if (signUpResult.data?.user) return signUpResult.data.user;

  const signInResult = await auth.signIn.email({
    email: account.email,
    password: account.password,
  });
  if (signInResult.data?.user) return signInResult.data.user;

  throw new Error(
    `Could not provision Neon Auth account for ${account.email}: ` +
      `${signUpResult.error?.message ?? "sign-up failed"} / ${signInResult.error?.message ?? "sign-in failed"}`
  );
}

async function seedDatabase() {
  const dataSource = await getDataSource();
  const userRepo = dataSource.getRepository(User);
  const categoryRepo = dataSource.getRepository(Category);
  const expenseRepo = dataSource.getRepository(Expense);

  console.log("🌱 Starting database seed...");

  // Seed Users (real Neon Auth accounts + matching local rows)
  console.log("👤 Provisioning Neon Auth accounts...");
  const localUsers: Record<string, User> = {};
  for (const account of seedAccounts()) {
    const authUser = await ensureAuthUser(account);

    let localUser = await userRepo.findOneBy({ uid: authUser.id });
    if (!localUser) {
      localUser = userRepo.create({
        uid: authUser.id,
        email: account.email,
        name: account.name,
        role: "admin",
      });
      await userRepo.save(localUser);
    }
    localUsers[account.name.toLowerCase()] = localUser;
  }
  const momUser = localUsers["mom"];
  const dadUser = localUsers["dad"];
  console.log(`✅ Users seeded: ${Object.keys(localUsers).join(", ")}`);

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
  for (const account of seedAccounts()) {
    console.log(`  ${account.name}: ${account.email} (password set via .env.local)`);
  }

  return { users: Object.keys(localUsers).length, categories: categories.length, expenses: 5 };
}

// Run seed if executed directly
if (require.main === module) {
  seedDatabase()
    .then(async () => {
      const ds = await getDataSource();
      await ds.destroy();
    })
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    });
}

export { seedDatabase };
