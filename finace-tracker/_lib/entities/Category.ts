import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Expense } from "./Expense";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, unique: true })
  name: string;

  @Column({ type: "varchar", length: 20, default: "#10b981" })
  color: string;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  budgetAmount: number; // Monthly budget for this category in Naira

  @Column({ type: "varchar", length: 255, nullable: true })
  userId: string | null;

  @OneToMany(() => Expense, (expense) => expense.category)
  expenses: Expense[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
