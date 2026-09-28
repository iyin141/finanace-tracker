import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/_lib/auth";
import { auth } from "@/_lib/auth/server";
import { getDataSource } from "@/_lib/typeorm";
import { User } from "@/_lib/entities/User";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const dataSource = await getDataSource();
  const userRepo = dataSource.getRepository(User);
  const users = await userRepo.find({ order: { createdAt: "ASC" } });

  return NextResponse.json({
    data: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { email, password, name, role } = await req.json();
  if (!email || !password || !name) {
    return NextResponse.json({ message: "email, password, name are required." }, { status: 400 });
  }

  const { data, error } = await auth.signUp.email({ email, password, name });
  if (error || !data?.user) {
    return NextResponse.json({ message: error?.message ?? "Could not create Neon Auth account." }, { status: 400 });
  }

  const dataSource = await getDataSource();
  const userRepo = dataSource.getRepository(User);
  const newUser = userRepo.create({
    uid: data.user.id,
    email,
    name,
    role: role === "admin" ? "admin" : "member",
  });
  await userRepo.save(newUser);

  return NextResponse.json({
    data: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, createdAt: newUser.createdAt },
  }, { status: 201 });
}
