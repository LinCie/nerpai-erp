import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { Package, History } from "lucide-react";
import { getStockLevels, getMovementHistory } from "@/modules/inventory/presentation/actions/inventory.actions";
import { InventoryDashboard } from "@/modules/inventory/presentation/components/inventory-dashboard";
import { MovementHistory } from "@/modules/inventory/presentation/components/movement-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/presentation/components/ui/tabs";

export const metadata = {
  title: "Inventory",
};

export default async function InventoryPage() {
  const stockLevelsData = await getStockLevels({});
  const movementsData = await getMovementHistory({ limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">
          View stock levels and movement history across all warehouses
        </p>
      </div>

      <Tabs defaultValue="stock-levels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock-levels" className="gap-2">
            <Package className="h-4 w-4" />
            Stock Levels
          </TabsTrigger>
          <TabsTrigger value="movement-history" className="gap-2">
            <History className="h-4 w-4" />
            Movement History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock-levels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Current Stock Levels
              </CardTitle>
              <CardDescription>
                Real-time stock levels for all products and variants across warehouses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryDashboard stockLevels={stockLevelsData.data} />
              {stockLevelsData.total > 0 && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Showing {stockLevelsData.data.length} of {stockLevelsData.total} items
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movement-history">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
