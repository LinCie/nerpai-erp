"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ServerValidateError,
  createServerValidate,
} from "@tanstack/react-form-nextjs";
import { auth } from "@/shared/infrastructure/auth/auth";
import { attributeRepository } from "../../infrastructure/repositories/attribute.repository";
import {
  AttributeNotFoundError,
  AttributeOptionNotFoundError,
  AttributeOptionInUseError,
  AttributeService,
} from "../../application/services/attribute.service";
import { attributeSchema, attributeOptionSchema } from "../schemas/attribute.schema";

const attributeService = new AttributeService(attributeRepository);

const validateAttributeForm = createServerValidate({
  defaultValues: {
    name: "",
  },
  validators: {
    onSubmit: attributeSchema,
  },
  onServerValidate: () => {
    return undefined;
  },
});

const validateAttributeOptionForm = createServerValidate({
  defaultValues: {
    value: "",
  },
  validators: {
    onSubmit: attributeOptionSchema,
  },
  onServerValidate: () => {
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

function buildServerFormErrorState(formData: FormData, message: string, fieldName: string = "name") {
  const rawValue = formData.get(fieldName);
  const value = typeof rawValue === "string" ? rawValue : "";

  return {
    errorMap: {
      onServer: message,
    },
    values: { [fieldName]: value },
    errors: [message],
  };
}

export async function createAttribute(prev: unknown, formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    const validatedData = await validateAttributeForm(formData);

    await attributeService.createAttribute({
      name: validatedData.name,
      organizationId,
    });

    revalidatePath("/products");
    revalidatePath("/products/attributes");

    return undefined;
  } catch (e) {
    if (e instanceof ServerValidateError) {
      return e.formState;
    }

    console.error("Error creating attribute:", e);
    throw new Error("Failed to create attribute. Please try again.");
  }
}

export async function updateAttribute(prev: unknown, formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawAttributeId = formData.get("id");
    const attributeId = typeof rawAttributeId === "string" ? rawAttributeId : "";
    if (!attributeId) {
      return buildServerFormErrorState(formData, "Attribute ID is required");
    }

    const validatedData = await validateAttributeForm(formData);

    await attributeService.updateAttribute({
      id: attributeId,
      name: validatedData.name,
      organizationId,
    });

    revalidatePath("/products");
    revalidatePath("/products/attributes");

    return undefined;
  } catch (e) {
    if (e instanceof ServerValidateError) {
      return e.formState;
    }
    if (e instanceof AttributeNotFoundError) {
      return buildServerFormErrorState(formData, e.message);
    }

    console.error("Error updating attribute:", e);
    throw new Error("Failed to update attribute. Please try again.");
  }
}

export async function softDeleteAttribute(formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawAttributeId = formData.get("id");
    const attributeId = typeof rawAttributeId === "string" ? rawAttributeId : "";
    if (!attributeId) {
      throw new Error("Attribute ID is required");
    }

    const deleted = await attributeService.softDeleteAttribute({
      id: attributeId,
      organizationId,
    });

    if (!deleted) {
      return { success: false, error: "Attribute not found" };
    }

    revalidatePath("/products");
    revalidatePath("/products/attributes");

    return { success: true };
  } catch (e) {
    console.error("Error soft-deleting attribute:", e);
    throw new Error("Failed to delete attribute. Please try again.");
  }
}

export async function createAttributeOption(prev: unknown, formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawAttributeId = formData.get("attributeId");
    const attributeId = typeof rawAttributeId === "string" ? rawAttributeId : "";
    if (!attributeId) {
      return buildServerFormErrorState(formData, "Attribute ID is required", "value");
    }

    const validatedData = await validateAttributeOptionForm(formData);

    await attributeService.createAttributeOption({
      value: validatedData.value,
      attributeId,
      organizationId,
    });

    revalidatePath("/products");
    revalidatePath("/products/attributes");

    return undefined;
  } catch (e) {
    if (e instanceof ServerValidateError) {
      return e.formState;
    }
    if (e instanceof AttributeNotFoundError) {
      return buildServerFormErrorState(formData, e.message, "value");
    }

    console.error("Error creating attribute option:", e);
    throw new Error("Failed to create attribute option. Please try again.");
  }
}

export async function updateAttributeOption(prev: unknown, formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawOptionId = formData.get("id");
    const optionId = typeof rawOptionId === "string" ? rawOptionId : "";
    if (!optionId) {
      return buildServerFormErrorState(formData, "Option ID is required", "value");
    }

    const validatedData = await validateAttributeOptionForm(formData);

    await attributeService.updateAttributeOption({
      id: optionId,
      value: validatedData.value,
      organizationId,
    });

    revalidatePath("/products");
    revalidatePath("/products/attributes");

    return undefined;
  } catch (e) {
    if (e instanceof ServerValidateError) {
      return e.formState;
    }
    if (e instanceof AttributeOptionNotFoundError) {
      return buildServerFormErrorState(formData, e.message, "value");
    }

    console.error("Error updating attribute option:", e);
    throw new Error("Failed to update attribute option. Please try again.");
  }
}

export async function deleteAttributeOption(formData: FormData) {
  try {
    const { organizationId } = await getSessionAndOrg();

    const rawOptionId = formData.get("id");
    const optionId = typeof rawOptionId === "string" ? rawOptionId : "";
    if (!optionId) {
      throw new Error("Option ID is required");
    }

    await attributeService.deleteAttributeOption({
      id: optionId,
      organizationId,
    });

    revalidatePath("/products");
    revalidatePath("/products/attributes");

    return { success: true };
  } catch (e) {
    if (e instanceof AttributeOptionNotFoundError) {
      return { success: false, error: e.message };
    }
    if (e instanceof AttributeOptionInUseError) {
      return { success: false, error: e.message };
    }

    console.error("Error deleting attribute option:", e);
    throw new Error("Failed to delete attribute option. Please try again.");
  }
}
