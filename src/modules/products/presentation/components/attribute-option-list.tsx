"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
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
import type { AttributeOption } from "../../domain/entities/attribute-option";
import { deleteAttributeOption } from "../actions/attribute.actions";
import { AttributeOptionForm } from "./attribute-option-form";

interface AttributeOptionListProps {
  attributeId: string;
  options: AttributeOption[];
  onSuccess?: () => void;
}

export function AttributeOptionList({ attributeId, options, onSuccess }: AttributeOptionListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (option: AttributeOption) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", option.id);

        const result = await deleteAttributeOption(formData);
        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success(`Option "${option.value}" has been deleted`);
        onSuccess?.();
      } catch {
        toast.error("Failed to delete option. Please try again.");
      }
    });
  };

  return (
    <div className="divide-y">
      {options.map((option) => (
        <div
          key={option.id}
          className="flex items-center justify-between p-3 hover:bg-muted/30"
        >
          <span className="text-sm">{option.value}</span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete option ${option.value}`}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Option</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{option.value}</strong>?
                  This action cannot be undone if the option is not in use.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(option)}
                  disabled={isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
      {options.length === 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No options yet. Add your first option below.
        </div>
      )}
      <div className="p-3 border-t">
        <AttributeOptionForm attributeId={attributeId} onSuccess={onSuccess} />
      </div>
    </div>
  );
}
