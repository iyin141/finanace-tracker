import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/_lib/typeorm";
import { Expense } from "@/_lib/entities/Expense";
import { Category } from "@/_lib/entities/Category";
import { verifyAuth } from "@/_lib/auth";

/**
 * GET /api/analytics/monthly-comparison
 * Compare spending across months with category breakdowns
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const months = searchParams.get("months") || "6"; // Default to 6 months
    const limitMonths = parseInt(months);

    const dataSource = await getDataSource();
    const expenseRepo = dataSource.getRepository(Expense);

    // Get monthly totals for the last N months
    const monthlyTotals = await expenseRepo
      .createQueryBuilder("e")
      .select("TO_CHAR(e.date::date, 'Mon YYYY')", "month")
      .addSelect("EXTRACT(YEAR FROM e.date::date)", "year")
      .addSelect("EXTRACT(MONTH FROM e.date::date)", "monthNum")
      .addSelect("COALESCE(SUM(e.amount), 0)", "total")
      .addSelect("COUNT(e.id)", "count")
      .where("e.date::date >= (CURRENT_DATE - INTERVAL '6 months')")
      .groupBy("month, year, monthNum")
      .orderBy("year", "ASC")
      .addOrderBy('"monthNum"', "ASC")
      .getRawMany();

    // Get category breakdown for each month
    const categoryBreakdown = await expenseRepo
      .createQueryBuilder("e")
      .leftJoin("e.category", "c")
      .select("TO_CHAR(e.date::date, 'Mon YYYY')", "month")
      .addSelect("EXTRACT(YEAR FROM e.date::date)", "year")
      .addSelect("EXTRACT(MONTH FROM e.date::date)", "monthNum")
      .addSelect("c.name", "category")
      .addSelect("COALESCE(SUM(e.amount), 0)", "total")
      .where("e.date::date >= (CURRENT_DATE - INTERVAL '6 months')")
      .groupBy("month, year, monthNum, c.name")
      .orderBy("year", "ASC")
      .addOrderBy('"monthNum"', "ASC")
      .addOrderBy('"total"', "DESC")
      .getRawMany();

    // Process data for comparison
    const monthlyData = monthlyTotals.map((m) => ({
      month: m.month,
      total: parseFloat(m.total),
      count: parseInt(m.count),
      categories: categoryBreakdown
        .filter((c) => c.month === m.month)
        .map((c) => ({
          category: c.category,
          total: parseFloat(c.total),
        })),
    }));

    // Calculate month-over-month changes
    const comparisonData = monthlyData.map((current, index) => {
      const previous = monthlyData[index - 1];
      let percentChange = 0;
      let amountChange = 0;

      if (previous) {
        amountChange = current.total - previous.total;
        percentChange = previous.total > 0
          ? ((amountChange / previous.total) * 100)
          : 0;
      }

      return {
        ...current,
        previousMonth: previous?.month || null,
        previousTotal: previous?.total || 0,
        amountChange,
        percentChange: parseFloat(percentChange.toFixed(2)),
      };
    });

    return NextResponse.json({
      data: comparisonData,
      summary: {
        totalMonths: comparisonData.length,
        averageMonthlySpend: comparisonData.reduce((sum, m) => sum + m.total, 0) / comparisonData.length,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/analytics/monthly-comparison]", err);
    return NextResponse.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}
