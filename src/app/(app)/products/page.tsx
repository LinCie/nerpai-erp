import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { Package } from "lucide-react";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Products</h1>
        <p className="text-muted-foreground">
          Manage your product catalog
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products
          </CardTitle>
          <CardDescription>
            View and manage all products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Product listing coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
