import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { ShoppingCart } from "lucide-react";

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Orders</h1>
        <p className="text-muted-foreground">
          Manage your orders
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Orders
          </CardTitle>
          <CardDescription>
            View and manage all orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Order listing coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
