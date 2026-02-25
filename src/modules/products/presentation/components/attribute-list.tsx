"use client";

import { Layers } from "lucide-react";
import type { AttributeWithOptions } from "../../domain/types";
import { EditAttributeDialog } from "./attribute-edit-dialog";
import { AttributeOptionList } from "./attribute-option-list";

interface AttributeListProps {
  attributes: AttributeWithOptions[];
  onSuccess?: () => void;
}

export function AttributeList({ attributes, onSuccess }: AttributeListProps) {
  if (attributes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {attributes.map(({ attribute, options }) => (
        <div
          key={attribute.id}
          className="rounded-md border"
        >
          <div className="flex items-center justify-between border-b bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="font-medium">{attribute.name}</span>
              <span className="text-sm text-muted-foreground">
                ({options.length} option{options.length !== 1 ? "s" : ""})
              </span>
            </div>
            <EditAttributeDialog attribute={attribute} onSuccess={onSuccess} />
          </div>
          <AttributeOptionList
            attributeId={attribute.id}
            options={options}
            onSuccess={onSuccess}
          />
        </div>
      ))}
    </div>
  );
}
