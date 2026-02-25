import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { Button } from "@/shared/presentation/components/ui/button";
import { auth } from "@/shared/infrastructure/auth/auth";
import { variantRepository } from "@/modules/products/infrastructure/repositories/variant.repository";
import { productRepository } from "@/modules/products/infrastructure/repositories/product.repository";
import { attributeRepository } from "@/modules/products/infrastructure/repositories/attribute.repository";
import { VariantService } from "@/modules/products/application/services/variant.service";
import { AttributeService } from "@/modules/products/application/services/attribute.service";
import { ProductAttributeConfig } from "@/modules/products/presentation/components/product-attribute-config";
import { VariantCombinationMatrix } from "@/modules/products/presentation/components/variant-combination-matrix";

interface VariantsPageProps {
  params: Promise<{ productId: string }>;
}

const variantService = new VariantService(variantRepository, productRepository, attributeRepository);
const attributeService = new AttributeService(attributeRepository);

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

export default async function VariantsPage({ params }: VariantsPageProps) {
  const { organizationId } = await getSessionAndOrg();
  const { productId } = await params;

  const productWithVariants = await variantService.getProductWithVariants({
    productId,
    organizationId,
  });

  if (!productWithVariants) {
    notFound();
  }

  const allAttributes = await attributeService.getAttributesWithOptions({
    organizationId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/products">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Configure Variants: {productWithVariants.productName}
          </h1>
          <p className="text-muted-foreground">
            Assign attributes and generate product variants
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Attributes
            </CardTitle>
            <CardDescription>
              Assign and reorder attributes for this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductAttributeConfig
              productId={productId}
              assignedAttributes={productWithVariants.attributes}
              availableAttributes={allAttributes}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate Variants</CardTitle>
            <CardDescription>
              Select option combinations to create variants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VariantCombinationMatrix
              productId={productId}
              attributes={productWithVariants.attributes}
              existingVariantCount={productWithVariants.variants.length}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
