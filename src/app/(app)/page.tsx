import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  if (!session.session.activeOrganizationId) {
    redirect("/organizations");
  }

  return children;
}
