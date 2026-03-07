import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { Warehouse as WarehouseIcon } from "lucide-react";
import { auth } from "@/shared/infrastructure/auth/auth";
import { warehouseRepository } from "@/modules/warehouses/infrastructure/repositories/warehouse.repository";
import { WarehouseService } from "@/modules/warehouses/application/services/warehouse.service";
import { AddWarehouseDialog } from "@/modules/warehouses/presentation/components/warehouse-add-dialog";
import { WarehouseListServer } from "@/modules/warehouses/presentation/components/warehouse-list-server";

interface WarehousesPageProps {
  searchParams: Promise<{ search?: string; province?: string; page?: string; limit?: string }>;
}

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

export default async function WarehousesPage({ searchParams }: WarehousesPageProps) {
  const { organizationId } = await getSessionAndOrg();
  const params = await searchParams;
  const searchQuery = params.search || "";
  const province = params.province;
  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "10", 10);
  const offset = (page - 1) * limit;

  const warehouses = await warehouseService.getWarehouses({
    organizationId,
    search: searchQuery || undefined,
    province: province || undefined,
    limit,
    offset,
  });

  const totalCount = await warehouseRepository.count({
    organizationId,
    search: searchQuery || undefined,
    province: province || undefined,
  });

  const provinces = await warehouseRepository.getUniqueProvinces(organizationId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
          <p className="text-muted-foreground">
            Manage your warehouse locations
          </p>
        </div>
        <AddWarehouseDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WarehouseIcon className="h-5 w-5" />
            All Warehouses
          </CardTitle>
          <CardDescription>
            View and manage all warehouse locations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <WarehouseListServer
            warehouses={warehouses}
            searchQuery={searchQuery}
            province={province}
            provinces={provinces}
            page={page}
            limit={limit}
            totalCount={totalCount}
          />
          {totalCount > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {offset + 1}-{Math.min(offset + limit, totalCount)} of {totalCount} warehouses
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`?page=${page - 1}${searchQuery ? `&search=${searchQuery}` : ""}${province ? `&province=${province}` : ""}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Previous
                  </a>
                )}
                {offset + limit < totalCount && (
                  <a
                    href={`?page=${page + 1}${searchQuery ? `&search=${searchQuery}` : ""}${province ? `&province=${province}` : ""}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}