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
import { ProductService } from "../../application/services/product.service";
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
    const productId = formData.get("id") as string;
    if (!productId) {
      throw new Error("Product ID is required");
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

    console.error("Error updating product:", e);
    throw new Error("Failed to update product. Please try again.");
  }
}

export async function softDeleteProduct(formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    const productId = formData.get("id") as string;
    if (!productId) {
      throw new Error("Product ID is required");
    }

    await productService.softDeleteProduct({
      id: productId,
      organizationId,
    });

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

    const productId = formData.get("id") as string;
    if (!productId) {
      throw new Error("Product ID is required");
    }

    await productService.restoreProduct({
      id: productId,
      organizationId,
    });

    revalidatePath("/products");
    revalidatePath("/products/trash");

    return { success: true };
  } catch (e) {
    console.error("Error restoring product:", e);
    throw new Error("Failed to restore product. Please try again.");
  }
}
