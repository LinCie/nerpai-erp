import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { Warehouse } from "lucide-react";
import { Skeleton } from "@/shared/presentation/components/ui/skeleton";

export default function WarehousesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            All Warehouses
          </CardTitle>
          <CardDescription>
            View and manage all warehouse locations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-9 w-full max-w-sm" />
          <div className="rounded-md border">
            <div className="border-b bg-muted/50 p-4">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}