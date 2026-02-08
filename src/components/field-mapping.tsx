"use client";

import React from "react";
import { ArrowRight, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldMapping, ContentfulField } from "@/types";

interface FieldMappingEditorProps {
  mappings: FieldMapping[];
  sourceHeaders: string[];
  targetFields: ContentfulField[];
  onMappingsChange: (mappings: FieldMapping[]) => void;
}

export function FieldMappingEditor({
  mappings,
  sourceHeaders,
  targetFields,
  onMappingsChange,
}: FieldMappingEditorProps) {
  const updateMapping = (
    sourceField: string,
    targetField: string
  ) => {
    const existing = mappings.find((m) => m.sourceField === sourceField);

    if (targetField === "") {
      // Remove mapping
      onMappingsChange(mappings.filter((m) => m.sourceField !== sourceField));
    } else if (existing) {
      // Update existing
      onMappingsChange(
        mappings.map((m) =>
          m.sourceField === sourceField
            ? { ...m, targetField, confidence: 1 }
            : m
        )
      );
    } else {
      // Add new
      onMappingsChange([
        ...mappings,
        { sourceField, targetField, confidence: 1 },
      ]);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr,auto,1fr,auto] gap-4 items-center font-medium text-sm text-muted-foreground pb-2 border-b">
        <span>Source Column</span>
        <span></span>
        <span>Contentful Field</span>
        <span>Confidence</span>
      </div>

      {sourceHeaders.map((header) => {
        const mapping = mappings.find((m) => m.sourceField === header);
        const targetField = targetFields.find(
          (f) => f.id === mapping?.targetField
        );

        return (
          <div
            key={header}
            className="grid grid-cols-[1fr,auto,1fr,auto] gap-4 items-center"
          >
            <div className="p-3 bg-muted rounded-md">
              <span className="font-medium text-sm">{header}</span>
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground" />

            <select
              value={mapping?.targetField || ""}
              onChange={(e) => updateMapping(header, e.target.value)}
              className="p-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Skip this column --</option>
              {targetFields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name} ({field.type})
                  {field.required ? " *" : ""}
                </option>
              ))}
            </select>

            <div className="w-24 flex items-center justify-center">
              {mapping ? (
                <div
                  className={cn(
                    "flex items-center gap-1 text-sm",
                    getConfidenceColor(mapping.confidence)
                  )}
                >
                  {mapping.confidence >= 0.8 ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span>{Math.round(mapping.confidence * 100)}%</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Required fields warning */}
      {targetFields
        .filter((f) => f.required)
        .some((f) => !mappings.find((m) => m.targetField === f.id)) && (
        <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Required fields not mapped
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              The following required fields are not mapped:{" "}
              {targetFields
                .filter(
                  (f) =>
                    f.required && !mappings.find((m) => m.targetField === f.id)
                )
                .map((f) => f.name)
                .join(", ")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
