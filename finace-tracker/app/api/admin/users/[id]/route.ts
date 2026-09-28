import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/_lib/auth";
import { auth } from "@/_lib/auth/server";
import { getDataSource } from "@/_lib/typeorm";
import { User } from "@/_lib/entities/User";

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const { role } = await req.json();
  if (role !== "admin" && role !== "member") {
    return NextResponse.json({ message: "role must be 'admin' or 'member'." }, { status: 400 });
  }

  const dataSource = await getDataSource();
  const userRepo = dataSource.getRepository(User);
  const user = await userRepo.findOneBy({ id });
  if (!user) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  user.role = role;
  await userRepo.save(user);

  // Best-effort: also reflect the role on the Neon Auth account. Local role is
  // authoritative for this app's own access control either way.
  try {
    await auth.admin.setRole({ userId: user.uid, role });
  } catch (err) {
    console.error("[PATCH /api/admin/users/:id] auth.admin.setRole failed", err);
  }

  return NextResponse.json({ data: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const dataSource = await getDataSource();
  const userRepo = dataSource.getRepository(User);
  const user = await userRepo.findOneBy({ id });
  if (!user) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  let authAccountRemoved = true;
  try {
    await auth.admin.removeUser({ userId: user.uid });
  } catch (err) {
    authAccountRemoved = false;
    console.error("[DELETE /api/admin/users/:id] auth.admin.removeUser failed", err);
  }

  await userRepo.remove(user);

  return NextResponse.json({
    message: authAccountRemoved
      ? "User removed."
      : "Local user row removed, but the Neon Auth account could not be removed — check server logs.",
  });
}
