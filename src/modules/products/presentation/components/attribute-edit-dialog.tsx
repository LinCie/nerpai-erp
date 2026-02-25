"use client";

import { useState, useCallback } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/presentation/components/ui/dialog";
import { toast } from "sonner";
import type { Attribute } from "../../domain/entities/attribute";
import { AttributeEditForm } from "./attribute-edit-form";

interface EditAttributeDialogProps {
  attribute: Attribute;
  onSuccess?: () => void;
}

export function EditAttributeDialog({ attribute, onSuccess }: EditAttributeDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = useCallback(() => {
    toast.success("Attribute updated successfully");
    setOpen(false);
    onSuccess?.();
  }, [onSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${attribute.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Attribute</DialogTitle>
        </DialogHeader>
        {open && <AttributeEditForm attribute={attribute} onSuccess={handleSuccess} />}
      </DialogContent>
    </Dialog>
  );
}
