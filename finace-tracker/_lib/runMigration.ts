import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Expense } from "./entities/Expense";
import { Category } from "./entities/Category";

async function runMigration() {
  const dataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: false,
    logging: true,
    entities: [User, Expense, Category],
    subscribers: [],
    migrations: ["./_lib/migrations/*.ts"],
    ssl: true,
    extra: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  });

  try {
    await dataSource.initialize();
    console.log("Running migrations...");
    await dataSource.runMigrations();
    console.log("Migrations completed successfully!");
    await dataSource.destroy();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
