import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { Button } from "@/shared/presentation/components/ui/button";
import { Package, ArrowLeft, Trash2 } from "lucide-react";
import { auth } from "@/shared/infrastructure/auth/auth";
import { productRepository } from "@/modules/products/infrastructure/repositories/product.repository";
import { ProductService } from "@/modules/products/application/services/product.service";
import { ProductTrashList } from "@/modules/products/presentation/components/product-trash-list";

const productService = new ProductService(productRepository);

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

export default async function TrashPage() {
  const { organizationId } = await getSessionAndOrg();

  const deletedProducts = await productService.getDeletedProducts({
    organizationId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trash</h1>
          <p className="text-muted-foreground">
            Restore deleted products
          </p>
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
          {deletedProducts.length > 0 ? (
            <ProductTrashList products={deletedProducts} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                Trash is empty
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                Deleted products will appear here. You can restore them at any time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
