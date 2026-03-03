import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Settings, Package } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/presentation/components/ui/card";
import { Button } from "@/shared/presentation/components/ui/button";
import { auth } from "@/shared/infrastructure/auth/auth";
import { variantRepository } from "@/modules/products/infrastructure/repositories/variant.repository";
import { productRepository } from "@/modules/products/infrastructure/repositories/product.repository";
import { attributeRepository } from "@/modules/products/infrastructure/repositories/attribute.repository";
import { VariantService } from "@/modules/products/application/services/variant.service";
import { VariantList } from "@/modules/products/presentation/components/variant-list";
import { getTotalStockByVariantIds } from "@/modules/inventory/presentation/actions/inventory.actions";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

const variantService = new VariantService(
  variantRepository,
  productRepository,
  attributeRepository,
);

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

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { organizationId } = await getSessionAndOrg();
  const { productId } = await params;

  const productWithVariants = await variantService.getProductWithVariants({
    productId,
    organizationId,
  });

  if (!productWithVariants) {
    notFound();
  }

  const variantIds = productWithVariants.variants.map((v) => v.variant.id);
  const stockByVariantId =
    variantIds.length > 0
      ? await getTotalStockByVariantIds(variantIds)
      : new Map<string, number>();

  const hasAttributes = productWithVariants.attributes.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/products">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {productWithVariants.productName}
            </h1>
            <p className="text-muted-foreground">
              Product details and variants
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/products/${productId}/variants`}>
            <Settings className="h-4 w-4 mr-2" />
            Configure Variants
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{productWithVariants.productName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Product ID</p>
              <p className="font-mono text-sm">{productId}</p>
            </div>
            {hasAttributes && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Attributes</p>
                <div className="flex flex-wrap gap-2">
                  {productWithVariants.attributes.map(
                    ({ attribute, options }) => (
                      <div
                        key={attribute.id}
                        className="inline-flex items-center rounded-full border px-3 py-1 text-sm"
                      >
                        <span className="font-medium">{attribute.name}</span>
                        <span className="text-muted-foreground ml-1">
                          ({options.length})
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Variants</CardTitle>
            <CardDescription>
              {productWithVariants.variants.length > 0
                ? `${productWithVariants.variants.length} variant${productWithVariants.variants.length !== 1 ? "s" : ""} configured`
                : "No variants configured yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VariantList
              variants={productWithVariants.variants}
              hasAttributes={hasAttributes}
              stockByVariantId={stockByVariantId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
