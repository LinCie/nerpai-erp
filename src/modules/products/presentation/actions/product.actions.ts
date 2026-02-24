"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ServerValidateError,
  createServerValidate,
} from "@tanstack/react-form-nextjs";
import { auth } from "@/shared/infrastructure/auth/auth";
import { productRepository } from "../../infrastructure/repositories/product.repository";
import {
  ProductNotFoundError,
  ProductService,
} from "../../application/services/product.service";
import { createProductFormOptions, updateProductFormOptions } from "../lib/form-options";

const productService = new ProductService(productRepository);

const validateCreateProductForm = createServerValidate({
  ...createProductFormOptions,
  onServerValidate: () => {
    // Additional server-side validation can be added here
    // Zod validation is already handled by formOpts.validators
    return undefined;
  },
});

const validateUpdateProductForm = createServerValidate({
  ...updateProductFormOptions,
  onServerValidate: () => {
    // Additional server-side validation can be added here
    // Zod validation is already handled by formOpts.validators
    return undefined;
  },
});

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

function buildServerFormErrorState(formData: FormData, message: string) {
  const rawName = formData.get("name");
  const name = typeof rawName === "string" ? rawName : "";

  return {
    errorMap: {
      onServer: message,
    },
    values: { name },
    errors: [message],
  };
}

export async function createProduct(prev: unknown, formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    // Validate form data using TanStack Form's server validation
    const validatedData = await validateCreateProductForm(formData);

    await productService.createProduct({
      name: validatedData.name,
      organizationId,
    });

    revalidatePath("/products");

    // Return undefined on success - form will reset naturally
    return undefined;
  } catch (e) {
    if (e instanceof ServerValidateError) {
      return e.formState;
    }

    console.error("Error creating product:", e);
    throw new Error("Failed to create product. Please try again.");
  }
}

export async function updateProduct(prev: unknown, formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    // Extract product ID from form data
    const rawProductId = formData.get("id");
    const productId = typeof rawProductId === "string" ? rawProductId : "";
    if (!productId) {
      return buildServerFormErrorState(formData, "Product ID is required");
    }

    // Validate form data using TanStack Form's server validation
    const validatedData = await validateUpdateProductForm(formData);

    await productService.updateProduct({
      id: productId,
      name: validatedData.name,
      organizationId,
    });

    revalidatePath("/products");

    // Return undefined on success - form will reset naturally
    return undefined;
  } catch (e) {
    if (e instanceof ServerValidateError) {
      return e.formState;
    }
    if (e instanceof ProductNotFoundError) {
      return buildServerFormErrorState(formData, e.message);
    }

    console.error("Error updating product:", e);
    throw new Error("Failed to update product. Please try again.");
  }
}

export async function softDeleteProduct(formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawProductId = formData.get("id");
    const productId = typeof rawProductId === "string" ? rawProductId : "";
    if (!productId) {
      throw new Error("Product ID is required");
    }

    const deleted = await productService.softDeleteProduct({
      id: productId,
      organizationId,
    });

    if (!deleted) {
      return { success: false, error: "Product not found" };
    }

    revalidatePath("/products");
    revalidatePath("/products/trash");

    return { success: true };
  } catch (e) {
    console.error("Error soft-deleting product:", e);
    throw new Error("Failed to delete product. Please try again.");
  }
}

export async function restoreProduct(formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawProductId = formData.get("id");
    const productId = typeof rawProductId === "string" ? rawProductId : "";
    if (!productId) {
      throw new Error("Product ID is required");
    }

    const restored = await productService.restoreProduct({
      id: productId,
      organizationId,
    });

    if (!restored) {
      return { success: false, error: "Product not found" };
    }

    revalidatePath("/products");
    revalidatePath("/products/trash");

    return { success: true };
  } catch (e) {
    console.error("Error restoring product:", e);
    throw new Error("Failed to restore product. Please try again.");
  }
}
