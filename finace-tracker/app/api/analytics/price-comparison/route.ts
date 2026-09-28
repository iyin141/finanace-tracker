import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/_lib/typeorm";
import { Expense } from "@/_lib/entities/Expense";
import { Category } from "@/_lib/entities/Category";
import { getSessionUser } from "@/_lib/auth";

/**
 * GET /api/analytics/price-comparison
 * Compare grocery prices across dates for specific categories
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getSessionUser();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dataSource = await getDataSource();
    const expenseRepo = dataSource.getRepository(Expense);

    let qb = expenseRepo
      .createQueryBuilder("e")
      .leftJoinAndSelect("e.category", "c")
      .leftJoinAndSelect("e.loggedByUser", "u")
      .orderBy("e.date", "ASC")
      .addOrderBy("e.item", "ASC");

    if (categoryId) {
      qb = qb.andWhere("e.categoryId = :categoryId", { categoryId });
    }
    if (startDate) {
      qb = qb.andWhere("e.date >= :startDate", { startDate });
    }
    if (endDate) {
      qb = qb.andWhere("e.date <= :endDate", { endDate });
    }

    const expenses = await qb.getMany();

    // Group by item to compare prices across dates
    const itemComparison = new Map<string, any[]>();
    expenses.forEach((expense) => {
      const itemKey = expense.item.toLowerCase().trim();
      if (!itemComparison.has(itemKey)) {
        itemComparison.set(itemKey, []);
      }
      itemComparison.get(itemKey)?.push({
        id: expense.id,
        date: expense.date,
        amount: expense.amount,
        category: expense.category?.name,
        loggedBy: expense.loggedByUser?.name,
        comments: expense.comments,
      });
    });

    // Convert to array and calculate price trends
    const comparisonData = Array.from(itemComparison.entries()).map(([item, records]) => {
      const amounts = records.map((r) => r.amount);
      const avgPrice = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
      const minPrice = Math.min(...amounts);
      const maxPrice = Math.max(...amounts);
      const priceRange = maxPrice - minPrice;

      return {
        item,
        records,
        statistics: {
          average: avgPrice,
          min: minPrice,
          max: maxPrice,
          range: priceRange,
          variance: priceRange > 0 ? ((priceRange / avgPrice) * 100).toFixed(2) : 0,
        },
      };
    });

    return NextResponse.json({
      data: comparisonData,
      summary: {
        totalItems: comparisonData.length,
        totalRecords: expenses.length,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/analytics/price-comparison]", err);
    return NextResponse.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}
