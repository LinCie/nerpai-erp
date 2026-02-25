"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/shared/infrastructure/auth/auth";
import { variantRepository } from "../../infrastructure/repositories/variant.repository";
import { productRepository } from "../../infrastructure/repositories/product.repository";
import { attributeRepository } from "../../infrastructure/repositories/attribute.repository";
import {
  ProductNotFoundError,
  AttributeNotFoundError,
  VariantNotFoundError,
  ProductAttributeNotFoundError,
  AttributeAlreadyAssignedError,
  AttributeListMismatchError,
  SKUConflictError,
  VariantService,
} from "../../application/services/variant.service";
import type { AssignAttributeResult, GenerateVariantsResult, RemoveAttributeResult, UpdateVariantResult } from "../../application/types";

const variantService = new VariantService(variantRepository, productRepository, attributeRepository);

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

export async function assignAttributeToProduct(formData: FormData): Promise<AssignAttributeResult> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawProductId = formData.get("productId");
    const rawAttributeId = formData.get("attributeId");

    const productId = typeof rawProductId === "string" ? rawProductId : "";
    const attributeId = typeof rawAttributeId === "string" ? rawAttributeId : "";

    if (!productId || !attributeId) {
      return { success: false, error: "Product ID and Attribute ID are required" };
    }

    const productAttribute = await variantService.assignAttributeToProduct({
      productId,
      attributeId,
      organizationId,
    });

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

    return {
      success: true,
      productAttribute: {
        id: productAttribute.id,
        displayOrder: productAttribute.displayOrder,
      },
    };
  } catch (e) {
    if (e instanceof ProductNotFoundError) {
      return { success: false, error: e.message };
    }
    if (e instanceof AttributeNotFoundError) {
      return { success: false, error: e.message };
    }
    if (e instanceof AttributeAlreadyAssignedError) {
      return { success: false, error: e.message };
    }

    console.error("Error assigning attribute to product:", e);
    throw new Error("Failed to assign attribute. Please try again.");
  }
}

export async function removeAttributeFromProduct(formData: FormData): Promise<RemoveAttributeResult> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawProductId = formData.get("productId");
    const rawAttributeId = formData.get("attributeId");
    const rawConfirmed = formData.get("confirmed");

    const productId = typeof rawProductId === "string" ? rawProductId : "";
    const attributeId = typeof rawAttributeId === "string" ? rawAttributeId : "";
    const confirmed = rawConfirmed === "true";

    if (!productId || !attributeId) {
      return { success: false, deactivatedCount: 0, error: "Product ID and Attribute ID are required" };
    }

    const result = await variantService.removeAttributeFromProduct({
      productId,
      attributeId,
      confirmed,
      organizationId,
    });

    if (result.needsConfirmation) {
      return {
        success: false,
        deactivatedCount: 0,
        needsConfirmation: true,
        affectedCount: result.affectedCount,
        message: `Removing this attribute will deactivate all ${result.affectedCount} variants that use it. Continue?`,
      };
    }

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

    return {
      success: true,
      deactivatedCount: result.deactivatedCount,
    };
  } catch (e) {
    if (e instanceof ProductAttributeNotFoundError) {
      return { success: false, deactivatedCount: 0, error: e.message };
    }

    console.error("Error removing attribute from product:", e);
    throw new Error("Failed to remove attribute. Please try again.");
  }
}

export async function reorderProductAttributes(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawProductId = formData.get("productId");
    const rawOrderedIds = formData.get("orderedAttributeIds");

    const productId = typeof rawProductId === "string" ? rawProductId : "";
    const orderedIdsJson = typeof rawOrderedIds === "string" ? rawOrderedIds : "[]";
    const orderedAttributeIds = JSON.parse(orderedIdsJson) as string[];

    if (!productId) {
      return { success: false, error: "Product ID is required" };
    }

    await variantService.reorderProductAttributes({
      productId,
      orderedAttributeIds,
      organizationId,
    });

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

    return { success: true };
  } catch (e) {
    if (e instanceof AttributeListMismatchError) {
      return { success: false, error: e.message };
    }

    console.error("Error reordering product attributes:", e);
    throw new Error("Failed to reorder attributes. Please try again.");
  }
}

export async function generateVariants(formData: FormData): Promise<GenerateVariantsResult> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawProductId = formData.get("productId");
    const rawSelections = formData.get("selections");
    const rawOnlyNew = formData.get("onlyNew");

    const productId = typeof rawProductId === "string" ? rawProductId : "";
    const selectionsJson = typeof rawSelections === "string" ? rawSelections : "{}";
    const selections = JSON.parse(selectionsJson) as Record<string, string[]>;
    const onlyNew = rawOnlyNew === "true";

    if (!productId) {
      return { success: false, created: 0, variants: [], error: "Product ID is required" };
    }

    if (Object.keys(selections).length === 0) {
      return { success: false, created: 0, variants: [], error: "No selections provided" };
    }

    const result = await variantService.generateVariantsSelective({
      productId,
      selections,
      organizationId,
      onlyNew,
    });

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

    return {
      success: true,
      created: result.created,
      variants: result.variants.map((v) => ({ id: v.id, sku: v.sku })),
      skipped: result.skipped,
    };
  } catch (e) {
    if (e instanceof ProductNotFoundError) {
      return { success: false, created: 0, variants: [], error: e.message };
    }

    console.error("Error generating variants:", e);
    throw new Error("Failed to generate variants. Please try again.");
  }
}

export async function updateVariant(formData: FormData): Promise<UpdateVariantResult> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawId = formData.get("id");
    const rawSku = formData.get("sku");
    const rawPrice = formData.get("price");
    const rawStockQuantity = formData.get("stockQuantity");

    const id = typeof rawId === "string" ? rawId : "";
    if (!id) {
      return { success: false, error: "Variant ID is required" };
    }

    const updateData: { id: string; organizationId: string; sku?: string; price?: number; stockQuantity?: number } = {
      id,
      organizationId,
    };

    if (typeof rawSku === "string" && rawSku.trim() !== "") {
      updateData.sku = rawSku.trim();
    }

    if (typeof rawPrice === "string" && rawPrice.trim() !== "") {
      const price = parseFloat(rawPrice);
      if (!isNaN(price)) {
        updateData.price = price;
      }
    }

    if (typeof rawStockQuantity === "string" && rawStockQuantity.trim() !== "") {
      const stockQuantity = parseInt(rawStockQuantity, 10);
      if (!isNaN(stockQuantity)) {
        updateData.stockQuantity = stockQuantity;
      }
    }

    const variant = await variantService.updateVariant(updateData);

    revalidatePath("/products");
    revalidatePath(`/products/${variant.productId}`);

    return {
      success: true,
      variant: {
        id: variant.id,
        sku: variant.sku,
        price: parseFloat(variant.price),
        stockQuantity: variant.stockQuantity,
      },
    };
  } catch (e) {
    if (e instanceof VariantNotFoundError) {
      return { success: false, error: e.message };
    }
    if (e instanceof SKUConflictError) {
      return { success: false, error: e.message };
    }

    console.error("Error updating variant:", e);
    throw new Error("Failed to update variant. Please try again.");
  }
}

export async function toggleVariantActive(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawId = formData.get("id");
    const rawIsActive = formData.get("isActive");

    const id = typeof rawId === "string" ? rawId : "";
    const isActive = rawIsActive === "true";

    if (!id) {
      return { success: false, error: "Variant ID is required" };
    }

    await variantService.toggleVariantActive({
      id,
      isActive,
      organizationId,
    });

    revalidatePath("/products");

    return { success: true };
  } catch (e) {
    if (e instanceof VariantNotFoundError) {
      return { success: false, error: e.message };
    }

    console.error("Error toggling variant active:", e);
    throw new Error("Failed to toggle variant status. Please try again.");
  }
}

export async function softDeleteVariant(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawId = formData.get("id");
    const id = typeof rawId === "string" ? rawId : "";

    if (!id) {
      return { success: false, error: "Variant ID is required" };
    }

    await variantService.softDeleteVariant({
      id,
      organizationId,
    });

    revalidatePath("/products");

    return { success: true };
  } catch (e) {
    if (e instanceof VariantNotFoundError) {
      return { success: false, error: e.message };
    }

    console.error("Error soft-deleting variant:", e);
    throw new Error("Failed to delete variant. Please try again.");
  }
}

export async function getExistingVariantCombinationKeys(productId: string): Promise<{
  success: boolean;
  keys?: string[];
  error?: string;
}> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const existingKeys = await variantService.getExistingVariantCombinationKeys({
      productId,
      organizationId,
    });

    return {
      success: true,
      keys: Array.from(existingKeys),
    };
  } catch (e) {
    console.error("Error getting existing variant combinations:", e);
    return {
      success: false,
      error: "Failed to get existing combinations",
    };
  }
}
