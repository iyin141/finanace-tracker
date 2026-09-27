import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/_lib/typeorm";
import { Category } from "@/_lib/entities/Category";

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(Category);
    const category = await repo.findOne({ where: { id }, relations: ["expenses"] });
    if (!category) return NextResponse.json({ message: "Not found." }, { status: 404 });
    return NextResponse.json({ data: category });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await req.json();
    const ds = await getDataSource();
    const repo = ds.getRepository(Category);
    const category = await repo.findOneBy({ id });
    if (!category) return NextResponse.json({ message: "Not found." }, { status: 404 });
    Object.assign(category, body);
    await repo.save(category);
    return NextResponse.json({ data: category });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(Category);
    const category = await repo.findOneBy({ id });
    if (!category) return NextResponse.json({ message: "Not found." }, { status: 404 });
    await repo.remove(category);
    return NextResponse.json({ message: "Deleted." });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message }, { status: 500 });
  }
}
