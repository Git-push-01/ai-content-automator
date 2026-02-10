"use client";

import React, { useState, useCallback } from "react";
import { FileUpload } from "@/components/file-upload";
import { DataPreview } from "@/components/data-preview";
import { FieldMappingEditor } from "@/components/field-mapping";
import { ProcessingSteps } from "@/components/processing-steps";
import { ImportResults } from "@/components/import-results";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Settings } from "lucide-react";
import {
  parseFile,
  getContentTypes,
  validateContent,
  importContent,
} from "@/app/actions";
import type {
  ParsedFileResult,
  ValidationResult,
  ImportResult,
  ContentfulContentType,
  FieldMapping,
  ProcessingStatus,
  ImportConfig,
} from "@/types";

export function ContentImporter() {
  const { toast } = useToast();

  // State
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [parsedFile, setParsedFile] = useState<ParsedFileResult | null>(null);
  const [contentTypes, setContentTypes] = useState<ContentfulContentType[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<string>("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Configuration
  const [locale, setLocale] = useState("en-US");
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [dryRun, setDryRun] = useState(true); // Demo mode - simulates import

  // Handle file upload
  const handleFileSelect = useCallback(
    async (file: File) => {
      setStatus("parsing");
      setProgress(10);
      setError(null);

      try {
        // Parse file
        const formData = new FormData();
        formData.append("file", file);
        const parseResult = await parseFile(formData);

        if (!parseResult.success || !parseResult.data) {
          throw new Error(parseResult.error || "Failed to parse file");
        }

        setParsedFile(parseResult.data);
        setProgress(30);

        // Fetch content types
        const typesResult = await getContentTypes();
        if (!typesResult.success || !typesResult.data) {
          throw new Error(typesResult.error || "Failed to fetch content types");
        }

        setContentTypes(typesResult.data);
        setProgress(50);
        setStatus("mapping");

        toast({
          title: "File parsed successfully",
          description: `Found ${parseResult.data.totalRows} rows and ${parseResult.data.headers.length} columns`,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setStatus("error");
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to process file",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Handle content type selection and validation
  const handleValidate = useCallback(async () => {
    if (!parsedFile || !selectedContentType) return;

    setStatus("validating");
    setProgress(60);
    setError(null);

    try {
      const result = await validateContent(parsedFile, selectedContentType);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Validation failed");
      }

      setValidation(result.data);
      setFieldMappings(result.data.mappedFields);
      setProgress(80);
      setStatus("mapping");

      if (result.data.warnings.length > 0) {
        toast({
          title: "Validation warnings",
          description: `${result.data.warnings.length} warnings found. Please review the field mappings.`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
      setStatus("error");
    }
  }, [parsedFile, selectedContentType, toast]);

  // Handle import
  const handleImport = useCallback(async () => {
    if (!parsedFile || !selectedContentType || fieldMappings.length === 0) return;

    setStatus("importing");
    setProgress(85);
    setError(null);

    // Dry run mode - simulate import for demo
    if (dryRun) {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate delay
      
      const simulatedResult: ImportResult = {
        success: true,
        totalProcessed: parsedFile.rows.length,
        created: parsedFile.rows.length,
        updated: 0,
        failed: 0,
        entries: parsedFile.rows.map((_, index) => ({
          row: index + 1,
          entryId: `simulated-${index + 1}`,
          contentType: selectedContentType,
          action: "created" as const,
          status: publishImmediately ? "published" as const : "draft" as const,
        })),
        errors: [],
      };

      setImportResult(simulatedResult);
      setProgress(100);
      setStatus("complete");

      toast({
        title: "🎭 Demo Import Complete",
        description: `Simulated creating ${simulatedResult.created} entries (dry run mode)`,
      });
      return;
    }

    const config: ImportConfig = {
      contentTypeId: selectedContentType,
      locale,
      publishImmediately,
      fieldMappings,
    };

    try {
      const result = await importContent(parsedFile, config);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Import failed");
      }

      setImportResult(result.data);
      setProgress(100);
      setStatus("complete");

      toast({
        title: result.data.success ? "Import successful" : "Import completed with errors",
        description: `Created ${result.data.created} entries, ${result.data.failed} failed`,
        variant: result.data.success ? "default" : "destructive",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStatus("error");
    }
  }, [parsedFile, selectedContentType, fieldMappings, locale, publishImmediately, dryRun, toast]);

  // Reset everything
  const handleReset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setParsedFile(null);
    setSelectedContentType("");
    setValidation(null);
    setFieldMappings([]);
    setImportResult(null);
  }, []);

  // Get current content type
  const currentContentType = contentTypes.find((ct) => ct.id === selectedContentType);

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      {status !== "idle" && status !== "complete" && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <ProcessingSteps currentStatus={status} error={error || undefined} />
        </div>
      )}

      {/* Step 1: File Upload */}
      {status === "idle" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Your File</CardTitle>
            <CardDescription>
              Drag and drop an Excel or CSV file to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload onFileSelect={handleFileSelect} />
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview & Content Type Selection */}
      {parsedFile && status === "mapping" && !validation && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>
                Review your uploaded data before proceeding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataPreview data={parsedFile} maxRows={5} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Content Type</CardTitle>
              <CardDescription>
                Choose the Contentful content type for your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={selectedContentType}
                onChange={(e) => setSelectedContentType(e.target.value)}
                className="w-full p-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a content type...</option>
                {contentTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name}
                  </option>
                ))}
              </select>

              <Button
                onClick={handleValidate}
                disabled={!selectedContentType}
                className="w-full"
              >
                {status === "validating" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Validate & Map Fields
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Step 3: Field Mapping */}
      {validation && currentContentType && status === "mapping" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Field Mapping</CardTitle>
              <CardDescription>
                Review and adjust how your columns map to Contentful fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldMappingEditor
                mappings={fieldMappings}
                sourceHeaders={parsedFile?.headers || []}
                targetFields={currentContentType.fields}
                onMappingsChange={setFieldMappings}
              />
            </CardContent>
          </Card>

          {/* Validation feedback */}
          {(validation.warnings.length > 0 || validation.suggestions.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Validation Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {validation.warnings.map((warning, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-3 bg-yellow-50 rounded-md"
                  >
                    <span className="text-yellow-600">⚠</span>
                    <p className="text-sm text-yellow-800">{warning.message}</p>
                  </div>
                ))}
                {validation.suggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-3 bg-blue-50 rounded-md"
                  >
                    <span className="text-blue-600">💡</span>
                    <p className="text-sm text-blue-800">{suggestion}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Import options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Import Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Locale</p>
                  <p className="text-sm text-muted-foreground">
                    Content language
                  </p>
                </div>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="p-2 rounded-md border bg-background"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">🎭 Demo Mode (Dry Run)</p>
                  <p className="text-sm text-muted-foreground">
                    Simulate import without creating entries
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Publish immediately</p>
                  <p className="text-sm text-muted-foreground">
                    Publish entries after creation
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Import button */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={fieldMappings.length === 0 || status === "importing"}
              className="flex-1"
              variant={dryRun ? "secondary" : "default"}
            >
              {status === "importing" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {dryRun ? `🎭 Demo Import ${parsedFile?.totalRows} Entries` : `Import ${parsedFile?.totalRows} Entries`}
            </Button>
          </div>
        </>
      )}

      {/* Importing state */}
      {status === "importing" && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Importing content...</p>
              <p className="text-sm text-muted-foreground">
                This may take a few moments
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {importResult && status === "complete" && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ImportResults result={importResult} onReset={handleReset} />
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {status === "error" && (
        <Card className="border-destructive">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
              <div>
                <p className="text-lg font-medium text-destructive">
                  Something went wrong
                </p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={handleReset}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
