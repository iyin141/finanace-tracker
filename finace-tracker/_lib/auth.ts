import { auth } from "./auth/server";
import { getDataSource } from "./typeorm";
import { User } from "./entities/User";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role?: string;
}

/**
 * Reads the current Neon Auth session (via next/headers cookies, handled by the SDK).
 * Returns null when there's no valid session.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const { data } = await auth.getSession();
  const user = data?.user;
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: (user as { role?: string }).role,
  };
}

/**
 * Resolves the current session's local `users` row and asserts role === "admin".
 * Returns null when unauthenticated or not an admin, per app-level role (not the
 * Neon Auth session's own role claim, which is a separate concept).
 */
export async function requireAdmin(): Promise<User | null> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const dataSource = await getDataSource();
  const userRepo = dataSource.getRepository(User);
  const localUser =
    (await userRepo.findOneBy({ uid: sessionUser.id })) ??
    (await userRepo.findOneBy({ email: sessionUser.email }));

  if (localUser?.role !== "admin") return null;
  return localUser;
}
