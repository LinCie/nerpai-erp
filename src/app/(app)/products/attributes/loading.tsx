import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { Layers } from "lucide-react";
import { Skeleton } from "@/shared/presentation/components/ui/skeleton";

export default function AttributesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Product Attributes
          </CardTitle>
          <CardDescription>
            Attributes define the dimensions along which products can vary.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-9 w-full max-w-sm" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-md border">
                <div className="flex items-center justify-between border-b bg-muted/50 p-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-8 w-8" />
                </div>
                <div className="divide-y">
                  {[1, 2].map((j) => (
                    <div key={j} className="flex items-center justify-between p-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
