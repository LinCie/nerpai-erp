import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { Trash2 } from "lucide-react";
import { Skeleton } from "@/shared/presentation/components/ui/skeleton";

export default function TrashLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Deleted Products
          </CardTitle>
          <CardDescription>
            Products that have been deleted can be restored here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="border-b bg-muted/50 p-4">
              <div className="grid grid-cols-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16 justify-self-end" />
              </div>
            </div>
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
