import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { auth } from "@/shared/infrastructure/auth/auth";
import { getOrders } from "@/modules/orders/presentation/actions/order.actions";
import { OrderList } from "@/modules/orders/presentation/components/order-list";
import { CreateOrderButton } from "@/modules/orders/presentation/components/order-form-dialog";
import type { OrderStatus } from "@/modules/orders/domain/types";

interface OrdersPageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string; limit?: string }>;
}

async function getSessionAndOrg() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/auth/sign-in");
  }

  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    redirect("/organizations");
  }

  return { session, organizationId };
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  await getSessionAndOrg();
  const params = await searchParams;
  const searchQuery = params.search || "";
  const status = params.status as OrderStatus | undefined;
  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "20", 10);
  const offset = (page - 1) * limit;

  const { data: orders, total } = await getOrders({
    status,
    search: searchQuery || undefined,
    limit,
    offset,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders and track fulfillment
          </p>
        </div>
        <CreateOrderButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            All Orders
          </CardTitle>
          <CardDescription>
            View and manage all customer orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderList
            orders={orders}
            searchQuery={searchQuery}
            status={status}
            page={page}
            limit={limit}
            total={total}
          />
        </CardContent>
      </Card>
    </div>
  );
}
