import "dotenv/config";
import "reflect-metadata";

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

  migrations: ["_lib/migrations/*.ts"],

  ssl: {
    rejectUnauthorized: false,
  },
});

export const getDataSource = async () => {
  if (AppDataSource.isInitialized) return AppDataSource;

  await AppDataSource.initialize();

  return AppDataSource;
};