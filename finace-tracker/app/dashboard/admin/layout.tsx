import { redirect } from "next/navigation";
import { requireAdmin } from "@/_lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
