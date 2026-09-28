import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/_lib/typeorm";
import { User } from "@/_lib/entities/User";
import { loginWithNeonAuth, createAuthResponse } from "@/_lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    console.log("[POST /api/auth/login] email:", email);
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    // Authenticate with Neon Auth
    const authResult = await loginWithNeonAuth(email, password);
    if (!authResult) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const { token, user: authUser } = authResult;

    // Get or create user in database
    const dataSource = await getDataSource();
    const userRepo = dataSource.getRepository(User);

    let user = await userRepo.findOneBy({ email: email });
    if (!user) {
      // Create new user with admin role
      user = userRepo.create({
        uid: authUser.uid || authUser.sub,
        email: email,
        name: authUser.name || email.split("@")[0],
        role: "admin",
      });
      await userRepo.save(user);
    }

    // Return user data with token
    return createAuthResponse(
      {
        user: {
          id: user.id,
          uid: user.uid,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      token,
      200
    );
  } catch (err: any) {
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}
