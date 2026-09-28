import { config } from "dotenv";
import "reflect-metadata";

config({ path: [".env.local", ".env"] });

import { DataSource } from "typeorm";

import { Expense } from "./entities/Expense";
import { Category } from "./entities/Category";
import { User } from "./entities/User";

/**
 * CLI-only datasource (migration:run / migration:revert / migration:generate).
 * Kept separate from typeorm.ts's AppDataSource so the app runtime never
 * globs+loads migration files — see the comment in typeorm.ts.
 */
export default new DataSource({
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
