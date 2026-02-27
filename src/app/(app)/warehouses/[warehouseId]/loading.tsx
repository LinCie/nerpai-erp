import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { Skeleton } from "@/shared/presentation/components/ui/skeleton";
import { Separator } from "@/shared/presentation/components/ui/separator";
import { 
  User, 
  FileText,
  Building2,
  Calendar,
  Package,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";

export default function WarehouseDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" disabled aria-label="Back to warehouses">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-10 w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Address Card Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              Address Information
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-48" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton className="h-3 w-24 mb-1" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div>
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Card Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Contact Information
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-48" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton className="h-3 w-24 mb-1" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-5 w-48" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Section Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-2" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardContent>
      </Card>

      {/* Inventory Summary Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            Inventory Summary
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mt-4" />
        </CardContent>
      </Card>

      <Separator />

      {/* Metadata Footer Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
}
