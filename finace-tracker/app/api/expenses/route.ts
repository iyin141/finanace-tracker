import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/_lib/typeorm";
import { Expense } from "@/_lib/entities/Expense";
import { Category } from "@/_lib/entities/Category";
import { User } from "@/_lib/entities/User";
import { getSessionUser } from "@/_lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getSessionUser();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const month      = searchParams.get("month"); // format: YYYY-MM
    const limit      = parseInt(searchParams.get("limit") ?? "200");

    const dataSource = await getDataSource();
    const expenseRepo = dataSource.getRepository(Expense);

    let qb = expenseRepo
      .createQueryBuilder("e")
      .leftJoinAndSelect("e.category", "c")
      .leftJoinAndSelect("e.loggedByUser", "u")
      .orderBy("e.date", "DESC")
      .addOrderBy("e.createdAt", "DESC")
      .take(limit);

    if (categoryId) {
      qb = qb.andWhere("e.categoryId = :categoryId", { categoryId });
    }
    if (month) {
      const [year, m] = month.split("-");
      qb = qb
        .andWhere("EXTRACT(YEAR  FROM e.date::date) = :y", { y: parseInt(year) })
        .andWhere("EXTRACT(MONTH FROM e.date::date) = :m", { m: parseInt(m) });
    }

    const expenses = await qb.getMany();
    return NextResponse.json({ data: expenses }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getSessionUser();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    const body = await req.json();
    const dataSource = await getDataSource();
    const expenseRepo  = dataSource.getRepository(Expense);
    const categoryRepo = dataSource.getRepository(Category);
    const userRepo     = dataSource.getRepository(User);

    if (!body.date || !body.amount || !body.item || !body.categoryId) {
      return NextResponse.json({ message: "date, amount, item, categoryId are required." }, { status: 400 });
    }

    const category = await categoryRepo.findOneBy({ id: body.categoryId });
    if (!category) {
      return NextResponse.json({ message: "Category not found." }, { status: 400 });
    }

    // Get the logged-in user from database
    const user = await userRepo.findOneBy({ uid: authUser.id }) || await userRepo.findOneBy({ email: authUser.email });

    const expense = expenseRepo.create({
      date:           body.date,
      amount:         Number(body.amount),
      item:           String(body.item).trim(),
      categoryId:     category.id,
      userId:         authUser.id,
      comments:       body.comments || null,
      loggedByUserId: user?.id || null,
    });

    await expenseRepo.save(expense);
    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}
