import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/_lib/typeorm";
import { Expense } from "@/_lib/entities/Expense";
import { getSessionUser } from "@/_lib/auth";

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(Expense);
    const expense = await repo.findOne({
      where: { id },
      relations: { category: true, loggedByUser: true },
    });
    if (!expense) return NextResponse.json({ message: "Not found." }, { status: 404 });
    return NextResponse.json({ data: expense });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const authUser = await getSessionUser();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    const body = await req.json();
    const ds = await getDataSource();
    const repo = ds.getRepository(Expense);
    const expense = await repo.findOne({
      where: { id },
      relations: { loggedByUser: true },
    });
    if (!expense) return NextResponse.json({ message: "Not found." }, { status: 404 });

    // Update only allowed fields
    if (body.date !== undefined) expense.date = body.date;
    if (body.amount !== undefined) expense.amount = Number(body.amount);
    if (body.item !== undefined) expense.item = String(body.item).trim();
    if (body.categoryId !== undefined) expense.categoryId = body.categoryId;
    if (body.comments !== undefined) expense.comments = body.comments;

    await repo.save(expense);
    return NextResponse.json({ data: expense });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(Expense);
    const expense = await repo.findOneBy({ id });
    if (!expense) return NextResponse.json({ message: "Not found." }, { status: 404 });
    await repo.remove(expense);
    return NextResponse.json({ message: "Deleted." });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message }, { status: 500 });
  }
}
