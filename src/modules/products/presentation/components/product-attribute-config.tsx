"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Layers } from "lucide-react";
import { Button } from "@/shared/presentation/components/ui/button";
import { Badge } from "@/shared/presentation/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/presentation/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  assignAttributeToProduct,
  removeAttributeFromProduct,
  reorderProductAttributes,
} from "../actions/variant.actions";
import type { AttributeWithOptions } from "../../domain/types";
import type { ProductAttribute } from "../../domain/entities/product-attribute";

interface SortableAttributeItemProps {
  productAttribute: ProductAttribute;
  attribute: AttributeWithOptions["attribute"];
  options: AttributeWithOptions["options"];
  onRemove: () => void;
  isRemoving: boolean;
}

function SortableAttributeItem({
  productAttribute,
  attribute,
  options,
  onRemove,
  isRemoving,
}: SortableAttributeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: productAttribute.attributeId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-md border bg-background p-4 ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{attribute.name}</span>
          <Badge variant="secondary" className="text-xs">
            {options.length} option{options.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {options.slice(0, 5).map((opt) => (
            <Badge key={opt.id} variant="outline" className="text-xs">
              {opt.value}
            </Badge>
          ))}
          {options.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{options.length - 5} more
            </Badge>
          )}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        disabled={isRemoving}
        aria-label="Remove attribute"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

interface ProductAttributeConfigProps {
  productId: string;
  assignedAttributes: Array<{
    productAttribute: ProductAttribute;
    attribute: AttributeWithOptions["attribute"];
    options: AttributeWithOptions["options"];
  }>;
  availableAttributes: AttributeWithOptions[];
  onAttributesChange?: () => void;
}

export function ProductAttributeConfig({
  productId,
  assignedAttributes,
  availableAttributes,
  onAttributesChange,
}: ProductAttributeConfigProps) {
  const [attributes, setAttributes] = useState(assignedAttributes);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{
    attributeId: string;
    affectedCount: number;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = attributes.findIndex(
        (a) => a.productAttribute.attributeId === active.id
      );
      const newIndex = attributes.findIndex(
        (a) => a.productAttribute.attributeId === over.id
      );

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const newAttributes = arrayMove(attributes, oldIndex, newIndex);
      setAttributes(newAttributes);

      try {
        const formData = new FormData();
        formData.append("productId", productId);
        formData.append(
          "orderedAttributeIds",
          JSON.stringify(newAttributes.map((a) => a.productAttribute.attributeId))
        );

        const result = await reorderProductAttributes(formData);
        if (!result.success) {
          toast.error(result.error || "Failed to reorder attributes");
          setAttributes(attributes);
        } else {
          onAttributesChange?.();
        }
      } catch {
        toast.error("Failed to reorder attributes");
        setAttributes(attributes);
      }
    },
    [attributes, productId, onAttributesChange]
  );

  const handleAddAttribute = async (attributeId: string) => {
    setAddingId(attributeId);
    try {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("attributeId", attributeId);

      const result = await assignAttributeToProduct(formData);
      if (result.success && result.productAttribute) {
        const attr = availableAttributes.find((a) => a.attribute.id === attributeId);
        if (attr) {
          const newProductAttribute: ProductAttribute = {
            id: result.productAttribute.id,
            productId,
            attributeId,
            displayOrder: result.productAttribute.displayOrder,
            organizationId: attr.attribute.organizationId,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          };
          setAttributes((prev) => [
            ...prev,
            {
              productAttribute: newProductAttribute,
              attribute: attr.attribute,
              options: attr.options,
            },
          ]);
        }
        toast.success("Attribute added to product");
        onAttributesChange?.();
      } else {
        toast.error(result.error || "Failed to add attribute");
      }
    } catch {
      toast.error("Failed to add attribute");
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveAttribute = async (attributeId: string, confirmed: boolean = false) => {
    setRemovingId(attributeId);
    try {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("attributeId", attributeId);
      formData.append("confirmed", String(confirmed));

      const result = await removeAttributeFromProduct(formData);

      if (result.needsConfirmation && result.affectedCount) {
        setConfirmRemove({ attributeId, affectedCount: result.affectedCount });
        setRemovingId(null);
        return;
      }

      if (result.success) {
        setAttributes((prev) =>
          prev.filter((a) => a.productAttribute.attributeId !== attributeId)
        );
        toast.success(
          result.deactivatedCount > 0
            ? `Attribute removed. ${result.deactivatedCount} variant(s) deactivated.`
            : "Attribute removed"
        );
        onAttributesChange?.();
      } else {
        toast.error(result.error || "Failed to remove attribute");
      }
    } catch {
      toast.error("Failed to remove attribute");
    } finally {
      setRemovingId(null);
    }
  };

  const confirmRemoveAttribute = () => {
    if (confirmRemove) {
      setConfirmRemove(null);
      handleRemoveAttribute(confirmRemove.attributeId, true);
    }
  };

  const unassignedAttributes = availableAttributes.filter(
    (attr) =>
      !attributes.some((a) => a.productAttribute.attributeId === attr.attribute.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Product Attributes</h3>
      </div>

      {attributes.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={attributes.map((a) => a.productAttribute.attributeId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {attributes.map(({ productAttribute, attribute, options }) => (
                <SortableAttributeItem
                  key={productAttribute.id}
                  productAttribute={productAttribute}
                  attribute={attribute}
                  options={options}
                  onRemove={() => handleRemoveAttribute(productAttribute.attributeId)}
                  isRemoving={removingId === productAttribute.attributeId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center">
          <Layers className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No attributes assigned. Add attributes to create variants.
          </p>
        </div>
      )}

      {unassignedAttributes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Available Attributes
          </h4>
          <div className="flex flex-wrap gap-2">
            {unassignedAttributes.map(({ attribute, options }) => (
              <Button
                key={attribute.id}
                variant="outline"
                size="sm"
                onClick={() => handleAddAttribute(attribute.id)}
                disabled={addingId === attribute.id}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                {attribute.name}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {options.length}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Attribute?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing this attribute will deactivate all {confirmRemove?.affectedCount}{" "}
              variant(s) that use it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveAttribute}>
              Remove Attribute
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
