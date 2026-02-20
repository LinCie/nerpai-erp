import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  return <div>{session.user.name}</div>;
}
