"use client";

import React from "react";
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImportResult } from "@/types";

interface ImportResultsProps {
  result: ImportResult;
  onReset: () => void;
}

export function ImportResults({ result, onReset }: ImportResultsProps) {
  const contentfulUrl = process.env.NEXT_PUBLIC_CONTENTFUL_WEB_URL || "https://app.contentful.com";

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div
        className={`p-6 rounded-lg border ${
          result.success
            ? "bg-green-50 border-green-200"
            : result.failed > 0 && result.created > 0
            ? "bg-yellow-50 border-yellow-200"
            : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-start gap-4">
          {result.success ? (
            <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
          ) : result.created > 0 ? (
            <AlertTriangle className="h-8 w-8 text-yellow-600 flex-shrink-0" />
          ) : (
            <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
          )}
          <div>
            <h3
              className={`text-lg font-semibold ${
                result.success
                  ? "text-green-800"
                  : result.created > 0
                  ? "text-yellow-800"
                  : "text-red-800"
              }`}
            >
              {result.success
                ? "Import Completed Successfully!"
                : result.created > 0
                ? "Import Completed with Errors"
                : "Import Failed"}
            </h3>
            <p
              className={`mt-1 ${
                result.success
                  ? "text-green-700"
                  : result.created > 0
                  ? "text-yellow-700"
                  : "text-red-700"
              }`}
            >
              Processed {result.totalProcessed} rows
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-muted text-center">
          <p className="text-3xl font-bold text-green-600">{result.created}</p>
          <p className="text-sm text-muted-foreground">Created</p>
        </div>
        <div className="p-4 rounded-lg bg-muted text-center">
          <p className="text-3xl font-bold text-blue-600">{result.updated}</p>
          <p className="text-sm text-muted-foreground">Updated</p>
        </div>
        <div className="p-4 rounded-lg bg-muted text-center">
          <p className="text-3xl font-bold text-red-600">{result.failed}</p>
          <p className="text-sm text-muted-foreground">Failed</p>
        </div>
      </div>

      {/* Entries created */}
      {result.entries.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted px-4 py-2 border-b">
            <p className="font-medium text-sm">Imported Entries</p>
          </div>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Row</th>
                  <th className="px-4 py-2 text-left font-medium">Entry ID</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.entries.slice(0, 20).map((entry) => (
                  <tr key={entry.entryId} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2">{entry.row}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {entry.entryId}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          entry.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <a
                        href={`${contentfulUrl}/spaces/${process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID}/entries/${entry.entryId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.entries.length > 20 && (
              <p className="px-4 py-2 text-sm text-muted-foreground bg-muted/30">
                Showing 20 of {result.entries.length} entries
              </p>
            )}
          </div>
        </div>
      )}

      {/* Errors */}
      {result.errors.length > 0 && (
        <div className="rounded-lg border border-red-200 overflow-hidden">
          <div className="bg-red-50 px-4 py-2 border-b border-red-200">
            <p className="font-medium text-sm text-red-800">
              Errors ({result.errors.length})
            </p>
          </div>
          <div className="max-h-40 overflow-y-auto bg-red-50/50">
            {result.errors.map((error, index) => (
              <div
                key={index}
                className="px-4 py-2 border-b border-red-100 last:border-b-0"
              >
                <p className="text-sm text-red-800">
                  {error.row > 0 && <span className="font-medium">Row {error.row}: </span>}
                  {error.message}
                </p>
                {error.details && (
                  <p className="text-xs text-red-600 mt-1">{error.details}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4 pt-4">
        <Button onClick={onReset} size="lg">
          Import Another File
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a
            href={contentfulUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Contentful
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
