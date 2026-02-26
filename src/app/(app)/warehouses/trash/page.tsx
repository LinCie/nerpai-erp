import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import { auth } from "@/shared/infrastructure/auth/auth";
import { warehouseRepository } from "@/modules/warehouses/infrastructure/repositories/warehouse.repository";
import { WarehouseService } from "@/modules/warehouses/application/services/warehouse.service";
import { WarehouseTrashList } from "@/modules/warehouses/presentation/components/warehouse-trash-list";

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

export default async function WarehouseTrashPage() {
  const { organizationId } = await getSessionAndOrg();

  const deletedWarehouses = await warehouseService.getDeletedWarehouses({
    organizationId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/warehouses">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Warehouses
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Trash</h1>
          <p className="text-muted-foreground">
            Manage deleted warehouses
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Deleted Warehouses
          </CardTitle>
          <CardDescription>
            These warehouses have been soft-deleted and can be restored at any time.
            They are not visible in the main warehouse list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WarehouseTrashList warehouses={deletedWarehouses} />
        </CardContent>
      </Card>
    </div>
  );
}
