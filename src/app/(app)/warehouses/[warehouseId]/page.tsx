import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/shared/infrastructure/auth/auth";
import { warehouseRepository } from "@/modules/warehouses/infrastructure/repositories/warehouse.repository";
import { WarehouseService } from "@/modules/warehouses/application/services/warehouse.service";
import { EditWarehouseDialog } from "@/modules/warehouses/presentation/components/warehouse-edit-dialog";
import { DeleteWarehouseDialog } from "@/modules/warehouses/presentation/components/warehouse-delete-dialog";
import { Button } from "@/shared/presentation/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { Badge } from "@/shared/presentation/components/ui/badge";
import { Separator } from "@/shared/presentation/components/ui/separator";
import { 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  FileText, 
  ArrowLeft,
  Package,
  Building2,
  Calendar
} from "lucide-react";

interface WarehouseDetailPageProps {
  params: Promise<{ warehouseId: string }>;
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function WarehouseDetailPage({ params }: WarehouseDetailPageProps) {
  const { organizationId } = await getSessionAndOrg();
  const { warehouseId } = await params;

  const warehouse = await warehouseService.getWarehouseById({
    id: warehouseId,
    organizationId,
  });

  if (!warehouse) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link href="/warehouses">
          <Button variant="ghost" size="icon" aria-label="Back to warehouses">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{warehouse.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{warehouse.code}</Badge>
            <span className="text-muted-foreground">
              {warehouse.city || warehouse.province ? (
                <>
                  <MapPin className="inline h-3 w-3 mr-1" />
                  {[warehouse.city, warehouse.province].filter(Boolean).join(", ")}
                </>
              ) : (
                "No location set"
              )}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <EditWarehouseDialog warehouse={warehouse} />
          <DeleteWarehouseDialog 
            warehouseId={warehouse.id} 
            warehouseName={warehouse.name}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Address Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Address Information
            </CardTitle>
            <CardDescription>
              Complete warehouse address details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {warehouse.streetAddress && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Street Address</p>
                <p className="text-sm">{warehouse.streetAddress}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">City</p>
                <p className="text-sm">{warehouse.city || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Province/State</p>
                <p className="text-sm">{warehouse.province || "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Postal Code</p>
                <p className="text-sm">{warehouse.postalCode || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Country</p>
                <p className="text-sm">{warehouse.country}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Primary contact person for this warehouse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contact Name</p>
              <p className="text-sm">{warehouse.contactName || "—"}</p>
            </div>
            {warehouse.contactPhone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone
                </p>
                <p className="text-sm">{warehouse.contactPhone}</p>
              </div>
            )}
            {warehouse.contactEmail && (
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </p>
                <a 
                  href={`mailto:${warehouse.contactEmail}`} 
                  className="text-sm text-blue-600 hover:underline"
                >
                  {warehouse.contactEmail}
                </a>
              </div>
            )}
            {!warehouse.contactName && !warehouse.contactPhone && !warehouse.contactEmail && (
              <p className="text-sm text-muted-foreground italic">
                No contact information provided
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes Section */}
      {warehouse.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{warehouse.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Inventory Summary Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Summary
          </CardTitle>
          <CardDescription>
            Current stock levels and SKU count for this warehouse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Distinct SKUs</p>
              <p className="text-2xl font-bold text-muted-foreground">Not available yet</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Total Quantity</p>
              <p className="text-2xl font-bold text-muted-foreground">Not available yet</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Inventory tracking will be available in a future update.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Metadata Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Created: {formatDate(warehouse.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Last Updated: {formatDate(warehouse.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
