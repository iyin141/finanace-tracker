import { config } from "dotenv";
import "reflect-metadata";

config({ path: [".env.local", ".env"] });

import { DataSource } from "typeorm";

import { Expense } from "./entities/Expense";
import { Category } from "./entities/Category";
import { User } from "./entities/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,

  synchronize: false,
  logging: false,

  entities: [User, Expense, Category],

  // No `migrations` here: the app runtime never runs migrations, and TypeORM
  // eagerly globs+loads migration .ts files at initialize() time even when
  // unused, which breaks inside Next's bundled server (ESM/CJS interop).
  // The CLI-only datasource in migrations-datasource.ts has it instead.

  ssl: {
    rejectUnauthorized: false,
  },
});

export const getDataSource = async () => {
  if (AppDataSource.isInitialized) return AppDataSource;

  await AppDataSource.initialize();

  return AppDataSource;
};