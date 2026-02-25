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
import type {
  AssignAttributeResult,
  GenerateVariantsResult,
  RemoveAttributeResult,
  UpdateVariantResult,
} from "../../application/types";
import {
  assignAttributeSchema,
  removeAttributeSchema,
  reorderAttributesSchema,
  generateVariantsSchema,
  updateVariantSchema,
  toggleVariantActiveSchema,
  softDeleteVariantSchema,
} from "../schemas/variant.schema";

const variantService = new VariantService(
  variantRepository,
  productRepository,
  attributeRepository,
);

function firstIssueMessage(issues: Array<{ message: string }>): string {
  return issues[0]?.message ?? "Invalid input";
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

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

export async function assignAttributeToProduct(
  formData: FormData,
): Promise<AssignAttributeResult> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawProductId = formData.get("productId");
    const rawAttributeId = formData.get("attributeId");

    const productId = typeof rawProductId === "string" ? rawProductId : "";
    const attributeId =
      typeof rawAttributeId === "string" ? rawAttributeId : "";

    const parsed = assignAttributeSchema.safeParse({ productId, attributeId });
    if (!parsed.success) {
      return { success: false, error: firstIssueMessage(parsed.error.issues) };
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

export async function removeAttributeFromProduct(
  formData: FormData,
): Promise<RemoveAttributeResult> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawProductId = formData.get("productId");
    const rawAttributeId = formData.get("attributeId");
    const rawConfirmed = formData.get("confirmed");

    const productId = typeof rawProductId === "string" ? rawProductId : "";
    const attributeId =
      typeof rawAttributeId === "string" ? rawAttributeId : "";
    const confirmed = rawConfirmed === "true";

    const parsed = removeAttributeSchema.safeParse({
      productId,
      attributeId,
      confirmed,
    });
    if (!parsed.success) {
      return {
        success: false,
        deactivatedCount: 0,
        error: firstIssueMessage(parsed.error.issues),
      };
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

export async function reorderProductAttributes(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawProductId = formData.get("productId");
    const rawOrderedIds = formData.get("orderedAttributeIds");

    const productId = typeof rawProductId === "string" ? rawProductId : "";
    if (typeof rawOrderedIds !== "string") {
      return { success: false, error: "orderedAttributeIds is required" };
    }
    const orderedAttributeIds = parseJson<unknown>(rawOrderedIds, []);
    if (!Array.isArray(orderedAttributeIds)) {
      return {
        success: false,
        error: "orderedAttributeIds must be a JSON array",
      };
    }

    const parsed = reorderAttributesSchema.safeParse({
      productId,
      orderedAttributeIds,
    });
    if (!parsed.success) {
      return { success: false, error: firstIssueMessage(parsed.error.issues) };
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

export async function generateVariants(
  formData: FormData,
): Promise<GenerateVariantsResult> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawProductId = formData.get("productId");
    const rawSelections = formData.get("selections");
    const rawOnlyNew = formData.get("onlyNew");

    const productId = typeof rawProductId === "string" ? rawProductId : "";
    if (typeof rawSelections !== "string") {
      return {
        success: false,
        created: 0,
        variants: [],
        error: "selections is required",
      };
    }
    const selections = parseJson<unknown>(rawSelections, {});
    const onlyNew = rawOnlyNew === "true";

    const parsed = generateVariantsSchema.safeParse({
      productId,
      selections,
    });
    if (!parsed.success) {
      return {
        success: false,
        created: 0,
        variants: [],
        error: firstIssueMessage(parsed.error.issues),
      };
    }
    if (Object.keys(parsed.data.selections).length === 0) {
      return {
        success: false,
        created: 0,
        variants: [],
        error: "No selections provided",
      };
    }

    const result = await variantService.generateVariantsSelective({
      productId,
      selections: selections as Record<string, string[]>,
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

export async function updateVariant(
  formData: FormData,
): Promise<UpdateVariantResult> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawId = formData.get("id");
    const rawSku = formData.get("sku");
    const rawPrice = formData.get("price");
    const rawStockQuantity = formData.get("stockQuantity");

    const id = typeof rawId === "string" ? rawId : "";
    const parsedId = softDeleteVariantSchema.safeParse({ id });
    if (!parsedId.success) {
      return {
        success: false,
        error: firstIssueMessage(parsedId.error.issues),
      };
    }

    const updateInput: {
      sku?: string;
      price?: number;
      stockQuantity?: number;
    } = {};

    if (typeof rawSku === "string") {
      updateInput.sku = rawSku.trim();
    }

    if (typeof rawPrice === "string" && rawPrice.trim() !== "") {
      const price = Number(rawPrice);
      if (Number.isNaN(price)) {
        return { success: false, error: "Price must be a number" };
      }
      updateInput.price = price;
    }

    if (
      typeof rawStockQuantity === "string" &&
      rawStockQuantity.trim() !== ""
    ) {
      const stockQuantity = Number(rawStockQuantity);
      if (Number.isNaN(stockQuantity)) {
        return { success: false, error: "Stock quantity must be a number" };
      }
      updateInput.stockQuantity = stockQuantity;
    }

    const parsedUpdate = updateVariantSchema.safeParse(updateInput);
    if (!parsedUpdate.success) {
      return {
        success: false,
        error: firstIssueMessage(parsedUpdate.error.issues),
      };
    }

    const updateData: {
      id: string;
      organizationId: string;
      sku?: string;
      price?: number;
      stockQuantity?: number;
    } = {
      id,
      organizationId,
      ...parsedUpdate.data,
    };

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

export async function toggleVariantActive(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawId = formData.get("id");
    const rawIsActive = formData.get("isActive");

    const id = typeof rawId === "string" ? rawId : "";
    const isActive = rawIsActive === "true";

    const parsed = toggleVariantActiveSchema.safeParse({ id, isActive });
    if (!parsed.success) {
      return { success: false, error: firstIssueMessage(parsed.error.issues) };
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

export async function softDeleteVariant(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawId = formData.get("id");
    const id = typeof rawId === "string" ? rawId : "";

    const parsed = softDeleteVariantSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, error: firstIssueMessage(parsed.error.issues) };
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

export async function getExistingVariantCombinationKeys(
  productId: string,
): Promise<{
  success: boolean;
  keys?: string[];
  error?: string;
}> {
  try {
    const { organizationId } = await getSessionAndOrg();
    const parsed = softDeleteVariantSchema.safeParse({ id: productId });
    if (!parsed.success) {
      return {
        success: false,
        error: firstIssueMessage(parsed.error.issues),
      };
    }

    const existingKeys = await variantService.getExistingVariantCombinationKeys(
      {
        productId,
        organizationId,
      },
    );

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

export async function checkSkuAvailability(formData: FormData): Promise<{
  success: boolean;
  available?: boolean;
  error?: string;
}> {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawId = formData.get("id");
    const rawSku = formData.get("sku");

    const id = typeof rawId === "string" ? rawId : "";
    const sku = typeof rawSku === "string" ? rawSku.trim() : "";

    const parsedId = softDeleteVariantSchema.safeParse({ id });
    if (!parsedId.success) {
      return {
        success: false,
        error: firstIssueMessage(parsedId.error.issues),
      };
    }

    const parsedSku = updateVariantSchema.safeParse({ sku });
    if (!parsedSku.success) {
      return {
        success: false,
        error: firstIssueMessage(parsedSku.error.issues),
      };
    }

    const exists = await variantService.checkSkuExists({
      sku,
      organizationId,
      excludeVariantId: id,
    });

    return {
      success: true,
      available: !exists,
    };
  } catch (e) {
    console.error("Error checking SKU availability:", e);
    return {
      success: false,
      error: "Failed to check SKU availability",
    };
  }
}
