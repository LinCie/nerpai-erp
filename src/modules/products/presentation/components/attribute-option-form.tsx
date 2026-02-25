"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import { Input } from "@/shared/presentation/components/ui/input";
import { toast } from "sonner";
import { createAttributeOption } from "../actions/attribute.actions";

interface AttributeOptionFormProps {
  attributeId: string;
  onSuccess?: () => void;
}

export function AttributeOptionForm({ attributeId, onSuccess }: AttributeOptionFormProps) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value.trim()) {
      toast.error("Option value is required");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("attributeId", attributeId);
        formData.append("value", value.trim());

        const result = await createAttributeOption(undefined, formData);
        
        if (result === undefined) {
          toast.success("Option added successfully");
          setValue("");
          onSuccess?.();
        } else if (result.errors) {
          toast.error(result.errors[0] ?? "Validation failed");
        }
      } catch {
        toast.error("Failed to add option. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add new option..."
        disabled={isPending}
        className="flex-1 h-9"
      />
      <Button type="submit" size="sm" disabled={isPending || !value.trim()}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
