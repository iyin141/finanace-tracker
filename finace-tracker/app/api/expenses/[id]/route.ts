import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/_lib/typeorm";
import { Expense } from "@/_lib/entities/Expense";

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(Expense);
    const expense = await repo.findOneBy({ id });
    if (!expense) return NextResponse.json({ message: "Not found." }, { status: 404 });
    return NextResponse.json({ data: expense });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await req.json();
    const ds = await getDataSource();
    const repo = ds.getRepository(Expense);
    const expense = await repo.findOneBy({ id });
    if (!expense) return NextResponse.json({ message: "Not found." }, { status: 404 });
    Object.assign(expense, body);
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
