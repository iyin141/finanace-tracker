import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/_lib/typeorm";
import { Expense } from "@/_lib/entities/Expense";
import { Category } from "@/_lib/entities/Category";
import { getSessionUser } from "@/_lib/auth";

/**
 * GET /api/stats
 * Returns aggregated dashboard statistics:
 *   - totalThisMonth, totalLastMonth, percentChange
 *   - categoryBreakdown (pie chart data)
 *   - monthlyTrend (last 6 months totals)
 *   - recentExpenses
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getSessionUser();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    const dataSource = await getDataSource();
    const expenseRepo = dataSource.getRepository(Expense);

    const now = new Date();
    const thisYear  = now.getFullYear();
    const thisMonth = now.getMonth() + 1; // 1-indexed

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastYear  = lastMonthDate.getFullYear();
    const lastMonth = lastMonthDate.getMonth() + 1;

    // --- This month total ---
    const thisMonthResult = await expenseRepo
      .createQueryBuilder("e")
      .select("COALESCE(SUM(e.amount), 0)", "total")
      .where("EXTRACT(YEAR  FROM e.date::date) = :y", { y: thisYear })
      .andWhere("EXTRACT(MONTH FROM e.date::date) = :m", { m: thisMonth })
      .getRawOne();

    // --- Last month total ---
    const lastMonthResult = await expenseRepo
      .createQueryBuilder("e")
      .select("COALESCE(SUM(e.amount), 0)", "total")
      .where("EXTRACT(YEAR  FROM e.date::date) = :y", { y: lastYear })
      .andWhere("EXTRACT(MONTH FROM e.date::date) = :m", { m: lastMonth })
      .getRawOne();

    // --- Category breakdown (this month) ---
    const categoryBreakdown = await expenseRepo
      .createQueryBuilder("e")
      .leftJoin("e.category", "c")
      .select("c.name", "name")
      .addSelect("COALESCE(SUM(e.amount), 0)", "value")
      .where("EXTRACT(YEAR  FROM e.date::date) = :y", { y: thisYear })
      .andWhere("EXTRACT(MONTH FROM e.date::date) = :m", { m: thisMonth })
      .groupBy("c.name")
      .orderBy('"value"', "DESC")
      .getRawMany();

    // --- Monthly trend (last 6 months) ---
    const monthlyTrend = await expenseRepo
      .createQueryBuilder("e")
      .select("TO_CHAR(e.date::date, 'Mon YYYY')", "month")
      .addSelect("EXTRACT(YEAR  FROM e.date::date)", "year")
      .addSelect("EXTRACT(MONTH FROM e.date::date)", "monthNum")
      .addSelect("COALESCE(SUM(e.amount), 0)", "total")
      .where("e.date::date >= (CURRENT_DATE - INTERVAL '6 months')")
      .groupBy("month, year, monthNum")
      .orderBy("year", "ASC")
      .addOrderBy('"monthNum"', "ASC")
      .getRawMany();

    // --- Recent expenses (last 10) ---
    const recentExpenses = await expenseRepo.find({
      relations: { category: true, loggedByUser: true },
      order: { date: "DESC", createdAt: "DESC" },
      take: 10,
    });

    // --- Total expense count this month ---
    const countThisMonth = await expenseRepo
      .createQueryBuilder("e")
      .where("EXTRACT(YEAR  FROM e.date::date) = :y", { y: thisYear })
      .andWhere("EXTRACT(MONTH FROM e.date::date) = :m", { m: thisMonth })
      .getCount();

    const totalThisMonth = parseFloat(thisMonthResult?.total ?? "0");
    const totalLastMonth = parseFloat(lastMonthResult?.total ?? "0");
    const percentChange =
      totalLastMonth === 0
        ? 0
        : Math.round(((totalThisMonth - totalLastMonth) / totalLastMonth) * 100);

    return NextResponse.json({
      totalThisMonth,
      totalLastMonth,
      percentChange,
      countThisMonth,
      categoryBreakdown: categoryBreakdown.map((c) => ({
        name: c.name ?? "Unknown",
        value: parseFloat(c.value),
      })),
      monthlyTrend: monthlyTrend.map((m) => ({
        month: m.month,
        total: parseFloat(m.total),
      })),
      recentExpenses,
    });
  } catch (err: any) {
    console.error("[GET /api/stats]", err);
    return NextResponse.json(
      { message: err?.message ?? "Unexpected error." },
      { status: 500 }
    );
  }
}
