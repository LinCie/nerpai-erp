import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/presentation/components/ui/card";
import { Layers } from "lucide-react";
import { auth } from "@/shared/infrastructure/auth/auth";
import { attributeRepository } from "@/modules/products/infrastructure/repositories/attribute.repository";
import { AttributeService } from "@/modules/products/application/services/attribute.service";
import { AttributeListServer } from "@/modules/products/presentation/components/attribute-list-server";

interface AttributesPageProps {
  searchParams: Promise<{ search?: string }>;
}

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

export default async function AttributesPage({ searchParams }: AttributesPageProps) {
  const { organizationId } = await getSessionAndOrg();
  const params = await searchParams;
  const searchQuery = params.search || "";

  const attributes = await attributeService.getAttributesWithOptions({
    organizationId,
  });

  const filteredAttributes = searchQuery
    ? attributes.filter(({ attribute }) =>
        attribute.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : attributes;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attributes</h1>
        <p className="text-muted-foreground">
          Define product attributes like Color, Size, or Material
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Product Attributes
          </CardTitle>
          <CardDescription>
            Attributes define the dimensions along which products can vary. Each attribute can have multiple option values.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttributeListServer
            attributes={filteredAttributes}
            searchQuery={searchQuery}
          />
        </CardContent>
      </Card>
    </div>
  );
}
