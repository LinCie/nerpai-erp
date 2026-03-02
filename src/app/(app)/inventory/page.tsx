import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { Package, History } from "lucide-react";
import { auth } from "@/shared/infrastructure/auth/auth";
import { getStockLevels, getMovementHistory } from "@/modules/inventory/presentation/actions/inventory.actions";
import { InventoryDashboard } from "@/modules/inventory/presentation/components/inventory-dashboard";
import { MovementHistory } from "@/modules/inventory/presentation/components/movement-history";
import { productRepository } from "@/modules/products/infrastructure/repositories/product.repository";
import { ProductService } from "@/modules/products/application/services/product.service";
import { warehouseRepository } from "@/modules/warehouses/infrastructure/repositories/warehouse.repository";
import { WarehouseService } from "@/modules/warehouses/application/services/warehouse.service";

export const metadata = {
  title: "Inventory",
};

const productService = new ProductService(productRepository);
const warehouseService = new WarehouseService(warehouseRepository);

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

export default async function InventoryPage() {
  const { organizationId } = await getSessionAndOrg();

  const [stockLevelsData, movementsData, products, warehouses] = await Promise.all([
    getStockLevels({}),
    getMovementHistory({ limit: 50 }),
    productService.getProducts({ organizationId }),
    warehouseService.getWarehouses({ organizationId }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">
          View stock levels and movement history across all warehouses
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Levels
          </CardTitle>
          <CardDescription>
            Real-time stock levels for all products and variants across warehouses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryDashboard
            stockLevels={stockLevelsData.data}
            products={products}
            warehouses={warehouses}
          />
          {stockLevelsData.total > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Showing {stockLevelsData.data.length} of {stockLevelsData.total} items
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Movement History
          </CardTitle>
          <CardDescription>
            Chronological audit trail of all stock movements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MovementHistory movements={movementsData.data} />
          {movementsData.total > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Showing {movementsData.data.length} of {movementsData.total} movements
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
