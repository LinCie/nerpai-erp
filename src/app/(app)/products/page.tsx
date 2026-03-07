import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/presentation/components/ui/card";
import { Package } from "lucide-react";
import { auth } from "@/shared/infrastructure/auth/auth";
import { productRepository } from "@/modules/products/infrastructure/repositories/product.repository";
import { ProductService } from "@/modules/products/application/services/product.service";
import { AddProductDialog } from "@/modules/products/presentation/components/product-add-dialog";
import { ProductListServer } from "@/modules/products/presentation/components/product-list-server";

interface ProductsPageProps {
  searchParams: Promise<{ search?: string; page?: string; limit?: string }>;
}

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

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const { organizationId } = await getSessionAndOrg();
  const params = await searchParams;
  const searchQuery = params.search || "";

  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 10;

  const productsData = await productService.getProducts({
    organizationId,
    search: searchQuery || undefined,
    page,
    limit,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <AddProductDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products
          </CardTitle>
          <CardDescription>View and manage all products</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProductListServer
            productsData={productsData}
            searchQuery={searchQuery}
          />
        </CardContent>
      </Card>
    </div>
  );
}
