"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/presentation/components/ui/dialog";
import { toast } from "sonner";
import { AttributeForm } from "./attribute-form";

interface AddAttributeDialogProps {
  onSuccess?: () => void;
}

export function AddAttributeDialog({ onSuccess }: AddAttributeDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = useCallback(() => {
    toast.success("Attribute created successfully");
    setOpen(false);
    onSuccess?.();
  }, [onSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id="add-attribute-trigger">
          <Plus className="w-4 h-4 mr-2" />
          Add Attribute
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Attribute</DialogTitle>
        </DialogHeader>
        {open && <AttributeForm onSuccess={handleSuccess} />}
      </DialogContent>
    </Dialog>
  );
}
