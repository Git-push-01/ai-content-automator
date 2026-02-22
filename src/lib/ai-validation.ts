import OpenAI from "openai";
import type {
  ParsedFileResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  FieldMapping,
  ContentfulContentType,
} from "@/types";
import { getTokenBudgetTracker } from "./token-budget";

export class AIValidationService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }

    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Validate and analyze parsed file data
   */
  async validateContent(
    parsedFile: ParsedFileResult,
    contentType: ContentfulContentType
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Get AI-powered field mappings
    const mappedFields = await this.suggestFieldMappings(
      parsedFile.headers,
      contentType.fields
    );

    // Validate required fields
    const requiredFields = contentType.fields.filter((f) => f.required);
    for (const field of requiredFields) {
      const mapping = mappedFields.find((m) => m.targetField === field.id);
      if (!mapping || mapping.confidence < 0.5) {
        warnings.push({
          field: field.id,
          message: `Required field "${field.name}" may not have a matching column in your file`,
        });
      }
    }

    // Validate data in rows
    for (let i = 0; i < Math.min(parsedFile.rows.length, 100); i++) {
      const row = parsedFile.rows[i];
      const rowNumber = i + 2;

      for (const mapping of mappedFields) {
        const value = row[mapping.sourceField];
        const targetField = contentType.fields.find(
          (f) => f.id === mapping.targetField
        );

        if (targetField) {
          const fieldErrors = this.validateFieldValue(
            value,
            targetField,
            rowNumber,
            mapping.sourceField
          );
          errors.push(...fieldErrors);
        }
      }
    }

    // Generate suggestions
    if (mappedFields.some((m) => m.confidence < 0.7)) {
      suggestions.push(
        "Some field mappings have low confidence. Please review and adjust the mappings before importing."
      );
    }

    if (parsedFile.rows.length > 100) {
      suggestions.push(
        `Only the first 100 of ${parsedFile.rows.length} rows were validated. All rows will be imported.`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      mappedFields,
    };
  }

  /**
   * Use AI to suggest field mappings between spreadsheet columns and Contentful fields
   */
  async suggestFieldMappings(
    sourceHeaders: string[],
    targetFields: { id: string; name: string; type: string }[]
  ): Promise<FieldMapping[]> {
    try {
      const prompt = `You are a data mapping assistant. Match spreadsheet column headers to CMS field names.

Source columns: ${JSON.stringify(sourceHeaders)}

Target fields: ${JSON.stringify(targetFields.map((f) => ({ id: f.id, name: f.name, type: f.type })))}

Return a JSON array of mappings with this structure:
[
  {
    "sourceField": "column name from source",
    "targetField": "field id from target",
    "confidence": 0.0 to 1.0,
    "transformRequired": boolean,
    "transformDescription": "description if transform needed"
  }
]

Only include mappings where there's a reasonable match. Be conservative with confidence scores.
Return ONLY the JSON array, no other text.`;

      // Check token budget before making API call
      const budgetTracker = getTokenBudgetTracker();
      const budgetCheck = budgetTracker.canMakeCall(2500);
      if (!budgetCheck.allowed) {
        console.warn(`Token budget exceeded: ${budgetCheck.reason}`);
        return this.fallbackFieldMapping(sourceHeaders, targetFields);
      }

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 2000,
      });

      // Record token usage
      if (response.usage) {
        budgetTracker.recordUsage(
          response.usage.prompt_tokens,
          response.usage.completion_tokens,
          "gpt-4o"
        );
        console.log(`📊 ${budgetTracker.getSummary()}`);
      }

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        return this.fallbackFieldMapping(sourceHeaders, targetFields);
      }

      // Parse JSON response
      const mappings = JSON.parse(content) as FieldMapping[];
      return mappings;
    } catch (error) {
      console.error("AI mapping failed, using fallback:", error);
      return this.fallbackFieldMapping(sourceHeaders, targetFields);
    }
  }

  /**
   * Fallback field mapping using simple string matching
   */
  private fallbackFieldMapping(
    sourceHeaders: string[],
    targetFields: { id: string; name: string }[]
  ): FieldMapping[] {
    const mappings: FieldMapping[] = [];

    for (const header of sourceHeaders) {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");

      for (const field of targetFields) {
        const normalizedId = field.id.toLowerCase().replace(/[^a-z0-9]/g, "");
        const normalizedName = field.name.toLowerCase().replace(/[^a-z0-9]/g, "");

        if (
          normalizedHeader === normalizedId ||
          normalizedHeader === normalizedName
        ) {
          mappings.push({
            sourceField: header,
            targetField: field.id,
            confidence: 0.8,
          });
          break;
        }

        // Partial match
        if (
          normalizedHeader.includes(normalizedId) ||
          normalizedId.includes(normalizedHeader) ||
          normalizedHeader.includes(normalizedName) ||
          normalizedName.includes(normalizedHeader)
        ) {
          mappings.push({
            sourceField: header,
            targetField: field.id,
            confidence: 0.5,
          });
          break;
        }
      }
    }

    return mappings;
  }

  /**
   * Validate a single field value
   */
  private validateFieldValue(
    value: any,
    field: { id: string; name: string; type: string; required: boolean },
    rowNumber: number,
    sourceField: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check required
    if (field.required && (value === null || value === undefined || value === "")) {
      errors.push({
        row: rowNumber,
        field: sourceField,
        message: `Required field "${field.name}" is empty`,
        value,
      });
      return errors;
    }

    // Type validation
    if (value !== null && value !== undefined && value !== "") {
      const strValue = String(value).trim();

      switch (field.type) {
        case "Integer":
          if (!Number.isInteger(Number(value))) {
            errors.push({
              row: rowNumber,
              field: sourceField,
              message: `"${field.name}" should be a whole number`,
              value,
            });
          }
          break;
        case "Number":
          if (isNaN(Number(value))) {
            errors.push({
              row: rowNumber,
              field: sourceField,
              message: `"${field.name}" should be a number`,
              value,
            });
          }
          break;
        case "Boolean":
          const boolStr = String(value).toLowerCase();
          if (!["true", "false", "yes", "no", "1", "0", "y", "n"].includes(boolStr)) {
            errors.push({
              row: rowNumber,
              field: sourceField,
              message: `"${field.name}" should be a boolean value (true/false, yes/no, 1/0)`,
              value,
            });
          }
          break;
        case "Link":
          // Must be a non-empty string (entry/asset ID or lookup:field:value)
          if (!strValue) {
            errors.push({
              row: rowNumber,
              field: sourceField,
              message: `"${field.name}" requires an entry/asset ID or lookup reference (e.g. "lookup:slug:my-article")`,
              value,
            });
          }
          break;
        case "Array":
          // Comma-separated values — just check it's not empty
          if (!strValue) {
            errors.push({
              row: rowNumber,
              field: sourceField,
              message: `"${field.name}" should be a comma-separated list of values`,
              value,
            });
          }
          break;
        case "RichText":
          // Any non-empty string is valid Markdown
          break;
        case "Object":
          try {
            const parsed = JSON.parse(strValue);
            if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
              errors.push({
                row: rowNumber,
                field: sourceField,
                message: `"${field.name}" should be a JSON object (e.g. {"key": "value"})`,
                value,
              });
            }
          } catch {
            errors.push({
              row: rowNumber,
              field: sourceField,
              message: `"${field.name}" contains invalid JSON`,
              value,
            });
          }
          break;
        case "Location": {
          const parts = strValue.split(",");
          if (parts.length !== 2 || isNaN(parseFloat(parts[0])) || isNaN(parseFloat(parts[1]))) {
            errors.push({
              row: rowNumber,
              field: sourceField,
              message: `"${field.name}" should be in "lat,lon" format (e.g. "40.7128,-74.0060")`,
              value,
            });
          }
          break;
        }
      }
    }

    return errors;
  }

  /**
   * Generate content suggestions using AI
   */
  async suggestContentImprovements(content: string): Promise<string[]> {
    try {
      // Check token budget before making API call
      const budgetTracker = getTokenBudgetTracker();
      const budgetCheck = budgetTracker.canMakeCall(1000);
      if (!budgetCheck.allowed) {
        console.warn(`Token budget exceeded: ${budgetCheck.reason}`);
        return [];
      }

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a content editor. Suggest brief improvements for the given content. Return a JSON array of suggestion strings.",
          },
          { role: "user", content },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      // Record token usage
      if (response.usage) {
        budgetTracker.recordUsage(
          response.usage.prompt_tokens,
          response.usage.completion_tokens,
          "gpt-4o"
        );
        console.log(`📊 ${budgetTracker.getSummary()}`);
      }

      const result = response.choices[0]?.message?.content?.trim();
      if (result) {
        return JSON.parse(result);
      }
    } catch {
      // Ignore errors
    }
    return [];
  }
}

// Factory function
export function createAIValidationService(): AIValidationService {
  return new AIValidationService();
}
