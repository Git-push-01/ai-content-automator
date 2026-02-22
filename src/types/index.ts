// Content row from spreadsheet
export interface ContentRow {
  [key: string]: string | number | boolean | null | undefined;
}

// Parsed file result
export interface ParsedFileResult {
  headers: string[];
  rows: ContentRow[];
  fileName: string;
  totalRows: number;
  errors: string[];
}

// Validation result from AI
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  mappedFields: FieldMapping[];
}

export interface ValidationError {
  row?: number;
  field: string;
  message: string;
  value?: string | number | boolean | null;
}

export interface ValidationWarning {
  row?: number;
  field: string;
  message: string;
  value?: string | number | boolean | null;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  transformRequired?: boolean;
  transformDescription?: string;
}

// Contentful entry
export interface ContentfulEntry {
  id?: string;
  contentType: string;
  fields: Record<string, any>;
  status: "draft" | "published";
}

// Import result
export interface ImportResult {
  success: boolean;
  totalProcessed: number;
  created: number;
  updated: number;
  failed: number;
  errors: ImportError[];
  entries: ImportedEntry[];
}

export interface ImportError {
  row: number;
  message: string;
  details?: string;
}

export interface ImportedEntry {
  row: number;
  entryId: string;
  contentType: string;
  action: "created" | "updated";
  status: "draft" | "published";
}

// Content type definition
export interface ContentfulContentType {
  id: string;
  name: string;
  description?: string;
  fields: ContentfulField[];
}

export interface ContentfulField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  localized: boolean;
  validations?: any[];
  /** For Link fields: "Entry" or "Asset" */
  linkType?: string;
  /** For Array fields: describes the items (e.g. Array of Links) */
  items?: {
    type: string;
    linkType?: string;
    validations?: any[];
  };
}

// Import configuration
export interface ImportConfig {
  contentTypeId: string;
  locale: string;
  publishImmediately: boolean;
  fieldMappings: FieldMapping[];
  defaultValues?: Record<string, any>;
}

// Processing status
export type ProcessingStatus =
  | "idle"
  | "parsing"
  | "validating"
  | "mapping"
  | "importing"
  | "complete"
  | "error";

export interface ProcessingState {
  status: ProcessingStatus;
  progress: number;
  message: string;
  currentStep?: string;
  error?: string;
}
