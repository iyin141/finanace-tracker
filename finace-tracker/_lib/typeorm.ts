import "reflect-metadata";
import { DataSource } from "typeorm";
import { Expense } from "./entities/Expense";
import { Category } from "./entities/Category";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: true, // Auto-create tables for now, use migrations for production
  logging: false,
  entities: [Expense, Category],
  subscribers: [],
  migrations: [],
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false, // Required for Neon
    },
  },
});

export const getDataSource = async () => {
  if (AppDataSource.isInitialized) return AppDataSource;
  await AppDataSource.initialize();
  return AppDataSource;
};
