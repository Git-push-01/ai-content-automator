import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { ParsedFileResult, ContentRow } from "@/types";

export class FileParserService {
  /**
   * Parse uploaded file (Excel or CSV)
   */
  static async parseFile(file: File): Promise<ParsedFileResult> {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".csv")) {
      return this.parseCSV(file);
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      return this.parseExcel(file);
    } else {
      throw new Error("Unsupported file format. Please upload a CSV or Excel file.");
    }
  }

  /**
   * Parse CSV file
   */
  private static async parseCSV(file: File): Promise<ParsedFileResult> {
    return new Promise((resolve, reject) => {
      const errors: string[] = [];

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        complete: (results) => {
          const headers = results.meta.fields || [];
          const rows = results.data as ContentRow[];

          // Collect parsing errors
          if (results.errors.length > 0) {
            results.errors.forEach((err) => {
              errors.push(`Row ${err.row}: ${err.message}`);
            });
          }

          resolve({
            headers,
            rows: this.cleanRows(rows, headers),
            fileName: file.name,
            totalRows: rows.length,
            errors,
          });
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        },
      });
    });
  }

  /**
   * Parse Excel file
   */
  private static async parseExcel(file: File): Promise<ParsedFileResult> {
    const errors: string[] = [];

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      // Use the first sheet
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error("Excel file contains no sheets");
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<ContentRow>(worksheet, {
        header: 1,
        defval: "",
      });

      if (jsonData.length === 0) {
        throw new Error("Excel sheet is empty");
      }

      // First row is headers
      const headerRow = jsonData[0] as unknown as string[];
      const headers = headerRow.map((h) => String(h).trim());

      // Remaining rows are data
      const dataRows = jsonData.slice(1);
      const rows: ContentRow[] = dataRows.map((row) => {
        const rowArray = row as unknown as any[];
        const obj: ContentRow = {};
        headers.forEach((header, index) => {
          obj[header] = rowArray[index] ?? null;
        });
        return obj;
      });

      return {
        headers,
        rows: this.cleanRows(rows, headers),
        fileName: file.name,
        totalRows: rows.length,
        errors,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Clean and normalize row data
   */
  private static cleanRows(rows: ContentRow[], headers: string[]): ContentRow[] {
    return rows
      .map((row) => {
        const cleanedRow: ContentRow = {};
        headers.forEach((header) => {
          let value = row[header];

          // Trim strings
          if (typeof value === "string") {
            value = value.trim();
            // Convert empty strings to null
            if (value === "") {
              value = null;
            }
          }

          cleanedRow[header] = value;
        });
        return cleanedRow;
      })
      .filter((row) => {
        // Remove completely empty rows
        return Object.values(row).some((v) => v !== null && v !== undefined && v !== "");
      });
  }

  /**
   * Validate basic file structure
   */
  static validateStructure(result: ParsedFileResult): string[] {
    const errors: string[] = [];

    if (result.headers.length === 0) {
      errors.push("No column headers found in the file");
    }

    if (result.rows.length === 0) {
      errors.push("No data rows found in the file");
    }

    // Check for duplicate headers
    const headerSet = new Set<string>();
    result.headers.forEach((header) => {
      if (headerSet.has(header.toLowerCase())) {
        errors.push(`Duplicate column header: "${header}"`);
      }
      headerSet.add(header.toLowerCase());
    });

    // Check for empty headers
    result.headers.forEach((header, index) => {
      if (!header || header.trim() === "") {
        errors.push(`Empty column header at position ${index + 1}`);
      }
    });

    return errors;
  }
}
