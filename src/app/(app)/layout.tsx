import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/shared/infrastructure/auth/auth";
import { SidebarProvider } from "@/shared/presentation/components/ui/sidebar";
import { AppSidebar } from "@/shared/presentation/components/layout/app-sidebar";
import { Header } from "@/shared/presentation/components/layout/header";
import { TooltipProvider } from "@/shared/presentation/components/ui/tooltip";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  if (!session.session.activeOrganizationId) {
    redirect("/organizations");
  }

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <main className="flex flex-1 flex-col min-h-screen bg-background">
          <Header />
          <div className="flex-1 p-6">{children}</div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
