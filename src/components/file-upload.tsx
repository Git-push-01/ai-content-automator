"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFileTypes?: string[];
  maxSize?: number;
  disabled?: boolean;
}

const DEFAULT_ACCEPTED_TYPES = [
  ".xlsx",
  ".xls",
  ".csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUpload({
  onFileSelect,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  maxSize = MAX_FILE_SIZE,
  disabled = false,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === "file-too-large") {
          setError(`File is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        } else if (rejection.errors[0]?.code === "file-invalid-type") {
          setError("Invalid file type. Please upload an Excel or CSV file.");
        } else {
          setError("Unable to process this file. Please try again.");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxSize,
    disabled,
    multiple: false,
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center w-full min-h-[200px] p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-destructive"
        )}
      >
        <input {...getInputProps()} />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <FileSpreadsheet className="h-10 w-10 text-primary" />
              <div className="flex flex-col">
                <span className="font-medium text-sm">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 ml-2"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Click or drag to replace this file
            </p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-colors",
                isDragActive ? "bg-primary/10" : "bg-muted"
              )}
            >
              <Upload
                className={cn(
                  "h-8 w-8 transition-colors",
                  isDragActive ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
            <p className="text-lg font-medium mb-1">
              {isDragActive ? "Drop your file here" : "Drag & drop your file here"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports Excel (.xlsx, .xls) and CSV files up to 10MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-3 p-3 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
