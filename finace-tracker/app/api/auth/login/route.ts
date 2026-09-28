import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/_lib/typeorm";
import { User } from "@/_lib/entities/User";
import { auth } from "@/_lib/auth/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    const { data, error } = await auth.signIn.email({ email, password });
    if (error || !data?.user) {
      return NextResponse.json({ message: error?.message ?? "Invalid credentials." }, { status: 401 });
    }

    // Get or create the matching local user row
    const dataSource = await getDataSource();
    const userRepo = dataSource.getRepository(User);

    let user = await userRepo.findOneBy({ uid: data.user.id });
    if (!user) {
      user = userRepo.create({
        uid: data.user.id,
        email: data.user.email,
        name: data.user.name || email.split("@")[0],
        role: "admin",
      });
      await userRepo.save(user);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}
