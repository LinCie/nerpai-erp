"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import { Input } from "@/shared/presentation/components/ui/input";
import { toast } from "sonner";
import { useCreateAttributeOption } from "../queries/use-attribute-options";

interface AttributeOptionFormProps {
  attributeId: string;
  onSuccess?: () => void;
}

export function AttributeOptionForm({ attributeId, onSuccess }: AttributeOptionFormProps) {
  const [value, setValue] = useState("");
  const createAttributeOptionMutation = useCreateAttributeOption();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!value.trim()) {
      toast.error("Option value is required");
      return;
    }

    try {
      await createAttributeOptionMutation.mutateAsync({
        attributeId,
        value: value.trim(),
      });
      toast.success("Option added successfully");
      setValue("");
      onSuccess?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add new option..."
        disabled={createAttributeOptionMutation.isPending}
        className="flex-1 h-9"
      />
      <Button
        type="submit"
        size="sm"
        disabled={createAttributeOptionMutation.isPending || !value.trim()}
      >
        {createAttributeOptionMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "value" in error) {
    const errorValue = (error as { value?: unknown }).value;
    if (
      errorValue &&
      typeof errorValue === "object" &&
      "error" in errorValue &&
      typeof (errorValue as { error?: unknown }).error === "string"
    ) {
      return (errorValue as { error: string }).error;
    }
  }

  return "Failed to add option. Please try again.";
}
