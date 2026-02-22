"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronDown, ChevronUp, Clock, Tag } from "lucide-react";

interface ContentType {
  id: string;
  name: string;
  description?: string;
  fieldCount: number;
}

interface Entry {
  id: string;
  createdAt: string;
  updatedAt: string;
  contentType: string;
  fields: Record<string, any>;
}

interface ContentDisplayProps {
  contentTypes: ContentType[];
  entriesPerType: Record<string, Entry[]>;
}

export function ContentDisplay({ contentTypes, entriesPerType }: ContentDisplayProps) {
  const [selectedType, setSelectedType] = useState<string>(contentTypes[0]?.id || "");
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const entries = entriesPerType[selectedType] || [];

  const toggleEntry = (id: string) => {
    const next = new Set(expandedEntries);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedEntries(next);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const getEntryTitle = (entry: Entry): string => {
    const fields = entry.fields;
    // Try common title field names
    const titleField = fields.title || fields.name || fields.productName || fields.headline;
    if (titleField) return String(titleField);
    // Fallback to first string field
    const firstString = Object.values(fields).find((v) => typeof v === "string");
    return firstString ? String(firstString) : entry.id;
  };

  const contentfulUrl = process.env.NEXT_PUBLIC_CONTENTFUL_WEB_URL || "https://app.contentful.com";
  const spaceId = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID;

  return (
    <div className="space-y-6">
      {/* Content Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {contentTypes.map((ct) => {
          const count = entriesPerType[ct.id]?.length || 0;
          return (
            <button
              key={ct.id}
              onClick={() => setSelectedType(ct.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === ct.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {ct.name}
              <span
                className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                  selectedType === ct.id
                    ? "bg-primary-foreground/20"
                    : "bg-background"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium mb-2">No entries yet</h3>
            <p className="text-muted-foreground">
              Import a CSV/Excel file to populate this content type.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const isExpanded = expandedEntries.has(entry.id);
            const fieldEntries = Object.entries(entry.fields);

            return (
              <Card key={entry.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleEntry(entry.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CardTitle className="text-lg">
                        {getEntryTitle(entry)}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Tag className="h-3 w-3" />
                        <span>{entry.contentType}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(entry.createdAt)}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t bg-muted/30">
                    <div className="grid gap-4 py-4">
                      {fieldEntries.map(([key, value]) => (
                        <div
                          key={key}
                          className="grid grid-cols-[200px,1fr] gap-4 items-start"
                        >
                          <span className="text-sm font-medium text-muted-foreground">
                            {key}
                          </span>
                          <span className="text-sm break-words">
                            {formatValue(value)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-xs text-muted-foreground font-mono">
                        ID: {entry.id}
                      </div>
                      {spaceId && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`${contentfulUrl}/spaces/${spaceId}/entries/${entry.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View in Contentful
                            <ExternalLink className="ml-2 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Stats Summary */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {entries.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Entries</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {Object.keys(entries[0]?.fields || {}).length}
              </div>
              <div className="text-sm text-muted-foreground">Fields per Entry</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {formatDate(entries[0]?.createdAt || new Date().toISOString()).split(",")[0]}
              </div>
              <div className="text-sm text-muted-foreground">Last Import</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
