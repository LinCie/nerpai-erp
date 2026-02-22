import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function CompletedOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Completed Orders</h1>
        <p className="text-muted-foreground">
          Successfully fulfilled orders
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Completed Orders
          </CardTitle>
          <CardDescription>
            View completed order history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Completed orders list coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
