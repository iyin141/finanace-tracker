import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Category } from "./Category";
import { User } from "./User";

@Entity("expenses")
@Index("idx_expenses_category_date", ["categoryId", "date"])
@Index("idx_expenses_logged_by", ["loggedByUserId"])
export class Expense {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "date" })
  date: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount: number;

  @Column({ type: "varchar", length: 255 })
  item: string;

  @Column({ type: "varchar", length: 255 })
  userId: string; // The ID from Neon Auth (kept for audit)

  @Column({ type: "text", nullable: true })
  comments: string;

  @ManyToOne(() => Category, category => category.expenses, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "categoryId" })
  category: Category;

  @Column({ type: "uuid" })
  categoryId: string;

  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "loggedByUserId" })
  loggedByUser: User;

  @Column({ type: "uuid", nullable: true })
  loggedByUserId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
