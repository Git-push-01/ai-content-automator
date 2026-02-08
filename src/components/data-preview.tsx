"use client";

import React from "react";
import type { ParsedFileResult } from "@/types";

interface DataPreviewProps {
  data: ParsedFileResult;
  maxRows?: number;
}

export function DataPreview({ data, maxRows = 5 }: DataPreviewProps) {
  const displayRows = data.rows.slice(0, maxRows);

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <div className="bg-muted px-4 py-2 border-b">
        <p className="text-sm font-medium">
          Preview: {data.fileName} ({data.totalRows} rows, {data.headers.length} columns)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground border-b w-12">
                #
              </th>
              {data.headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-2 text-left font-medium text-muted-foreground border-b whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, index) => (
              <tr key={index} className="hover:bg-muted/30">
                <td className="px-4 py-2 border-b text-muted-foreground">
                  {index + 1}
                </td>
                {data.headers.map((header) => (
                  <td
                    key={header}
                    className="px-4 py-2 border-b max-w-[200px] truncate"
                    title={String(row[header] ?? "")}
                  >
                    {row[header] !== null && row[header] !== undefined
                      ? String(row[header])
                      : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.totalRows > maxRows && (
        <div className="px-4 py-2 bg-muted/30 text-sm text-muted-foreground text-center">
          Showing {maxRows} of {data.totalRows} rows
        </div>
      )}

      {data.errors.length > 0 && (
        <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-100">
          <p className="text-sm font-medium text-yellow-800 mb-1">
            Parsing warnings:
          </p>
          <ul className="text-sm text-yellow-700 list-disc list-inside">
            {data.errors.slice(0, 3).map((error, i) => (
              <li key={i}>{error}</li>
            ))}
            {data.errors.length > 3 && (
              <li>...and {data.errors.length - 3} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
