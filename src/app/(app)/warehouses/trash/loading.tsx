import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { Trash2 } from "lucide-react";
import { Skeleton } from "@/shared/presentation/components/ui/skeleton";
import { Button } from "@/shared/presentation/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function WarehouseTrashLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" disabled>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Warehouses
            </Button>
          </div>
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Deleted Warehouses
          </CardTitle>
          <CardDescription>
            Loading deleted warehouses...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b last:border-b-0">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
