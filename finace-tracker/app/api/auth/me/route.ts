import { NextResponse } from "next/server";
import { getDataSource } from "@/_lib/typeorm";
import { User } from "@/_lib/entities/User";
import { getSessionUser } from "@/_lib/auth";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    const dataSource = await getDataSource();
    const userRepo = dataSource.getRepository(User);

    let user = await userRepo.findOneBy({ uid: sessionUser.id });
    if (!user) {
      user = await userRepo.findOneBy({ email: sessionUser.email });
    }
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
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
    console.error("[GET /api/auth/me]", err);
    return NextResponse.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}
