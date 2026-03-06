"use client";

import { Layers, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/shared/presentation/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/presentation/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAttributes, type AttributeWithOptionsApi } from "../queries/use-attributes";
import { useDeleteAttribute } from "../queries/use-delete-attribute";
import { EditAttributeDialog } from "./attribute-edit-dialog";
import { AttributeOptionList } from "./attribute-option-list";

interface AttributeListProps {
  initialAttributes: AttributeWithOptionsApi[];
  onSuccess?: () => void;
}

export function AttributeList({ initialAttributes, onSuccess }: AttributeListProps) {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? undefined;
  const { data: attributes = [], isLoading, isError, error } = useAttributes(
    { search },
    initialAttributes,
  );
  const deleteAttributeMutation = useDeleteAttribute();

  const handleDelete = async (attribute: AttributeWithOptionsApi) => {
    try {
      await deleteAttributeMutation.mutateAsync(attribute.id);
      toast.success(`"${attribute.name}" has been deleted`);
      onSuccess?.();
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Failed to delete attribute."));
    }
  };

  if (isError) {
    return (
      <div className="rounded-md border p-4 text-sm text-destructive">
        {getErrorMessage(error, "Failed to load attributes.")}
      </div>
    );
  }

  if (isLoading && attributes.length === 0) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        Loading attributes...
      </div>
    );
  }

  if (attributes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {attributes.map((attribute) => (
        <div
          key={attribute.id}
          className="rounded-md border"
        >
          <div className="flex items-center justify-between border-b bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="font-medium">{attribute.name}</span>
              <span className="text-sm text-muted-foreground">
                ({attribute.options.length} option
                {attribute.options.length !== 1 ? "s" : ""})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <EditAttributeDialog attribute={attribute} onSuccess={onSuccess} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${attribute.name}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Attribute</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete{" "}
                      <strong>{attribute.name}</strong>? This can impact variant
                      configuration and can be restored only via internal tooling.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      disabled={deleteAttributeMutation.isPending}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        void handleDelete(attribute);
                      }}
                      disabled={deleteAttributeMutation.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteAttributeMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <AttributeOptionList
            attributeId={attribute.id}
            options={attribute.options}
            onSuccess={onSuccess}
          />
        </div>
      ))}
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
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

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
