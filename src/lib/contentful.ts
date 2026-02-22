import { createClient } from "contentful-management";
import type {
  ContentfulContentType,
  ContentfulField,
  ImportConfig,
  ImportResult,
  ImportError,
  ImportedEntry,
  ContentRow,
  FieldMapping,
} from "@/types";
import {
  toEntryLink,
  toAssetLink,
  toEntryLinks,
  toAssetLinks,
  markdownToRichText,
  toJsonObject,
  toLocation,
  toBoolean,
  toNumber,
  toInteger,
  isLookup,
  parseLookup,
  isUrl,
} from "./value-transforms";

export class ContentfulService {
  private client;
  private spaceId: string;
  private environmentId: string;

  constructor() {
    const managementToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
    const spaceId = process.env.CONTENTFUL_SPACE_ID;
    const environmentId = process.env.CONTENTFUL_ENVIRONMENT || "master";

    if (!managementToken || !spaceId) {
      throw new Error(
        "Missing Contentful credentials. Please set CONTENTFUL_MANAGEMENT_TOKEN and CONTENTFUL_SPACE_ID environment variables."
      );
    }

    this.client = createClient({ accessToken: managementToken });
    this.spaceId = spaceId;
    this.environmentId = environmentId;
  }

  /**
   * Get available content types from Contentful
   */
  async getContentTypes(): Promise<ContentfulContentType[]> {
    try {
      const space = await this.client.getSpace(this.spaceId);
      const environment = await space.getEnvironment(this.environmentId);
      const contentTypes = await environment.getContentTypes();

      return contentTypes.items.map((ct) => ({
        id: ct.sys.id,
        name: ct.name,
        description: ct.description,
        fields: ct.fields.map((field) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          required: field.required || false,
          localized: field.localized || false,
          validations: field.validations,
          linkType: field.type === "Link" ? (field as any).linkType : undefined,
          items: field.type === "Array" ? (field as any).items : undefined,
        })),
      }));
    } catch (error) {
      throw new Error(
        `Failed to fetch content types: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get a specific content type by ID
   */
  async getContentType(contentTypeId: string): Promise<ContentfulContentType | null> {
    try {
      const space = await this.client.getSpace(this.spaceId);
      const environment = await space.getEnvironment(this.environmentId);
      const contentType = await environment.getContentType(contentTypeId);

      return {
        id: contentType.sys.id,
        name: contentType.name,
        description: contentType.description,
        fields: contentType.fields.map((field) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          required: field.required || false,
          localized: field.localized || false,
          validations: field.validations,
          linkType: field.type === "Link" ? (field as any).linkType : undefined,
          items: field.type === "Array" ? (field as any).items : undefined,
        })),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Import rows into Contentful
   */
  async importContent(
    rows: ContentRow[],
    config: ImportConfig
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      totalProcessed: 0,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
      entries: [],
    };

    try {
      const space = await this.client.getSpace(this.spaceId);
      const environment = await space.getEnvironment(this.environmentId);

      // Fetch content type fields for type-aware transforms
      let contentTypeFields: ContentfulField[] | undefined;
      try {
        const ct = await environment.getContentType(config.contentTypeId);
        contentTypeFields = ct.fields.map((field: any) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          required: field.required || false,
          localized: field.localized || false,
          validations: field.validations,
          linkType: field.type === "Link" ? field.linkType : undefined,
          items: field.type === "Array" ? field.items : undefined,
        }));
      } catch {
        // Continue without field definitions — basic transforms only
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // Account for header row and 0-indexing

        try {
          const fields = this.mapRowToFields(row, config, contentTypeFields);

          // Resolve any lookup references (e.g. "lookup:slug:my-article")
          await this.resolveLookupsInFields(fields, environment);
          
          // Create entry
          const entry = await environment.createEntry(config.contentTypeId, {
            fields,
          });

          // Publish if configured
          if (config.publishImmediately) {
            await entry.publish();
          }

          result.created++;
          result.entries.push({
            row: rowNumber,
            entryId: entry.sys.id,
            contentType: config.contentTypeId,
            action: "created",
            status: config.publishImmediately ? "published" : "draft",
          });
        } catch (error) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }

        result.totalProcessed++;
      }

      result.success = result.failed === 0;
    } catch (error) {
      result.success = false;
      result.errors.push({
        row: 0,
        message: `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    return result;
  }

  /**
   * Map a spreadsheet row to Contentful fields
   */
  private mapRowToFields(
    row: ContentRow,
    config: ImportConfig,
    contentTypeFields?: ContentfulField[]
  ): Record<string, any> {
    const fields: Record<string, any> = {};
    const locale = config.locale || "en-US";

    for (const mapping of config.fieldMappings) {
      const sourceValue = row[mapping.sourceField];
      
      if (sourceValue !== null && sourceValue !== undefined) {
        // Find the target field definition for type-aware transforms
        const fieldDef = contentTypeFields?.find(
          (f) => f.id === mapping.targetField
        );
        fields[mapping.targetField] = {
          [locale]: this.transformValue(sourceValue, mapping, fieldDef),
        };
      }
    }

    // Apply default values
    if (config.defaultValues) {
      for (const [field, value] of Object.entries(config.defaultValues)) {
        if (!fields[field]) {
          fields[field] = { [locale]: value };
        }
      }
    }

    return fields;
  }

  /**
   * Transform value based on the target Contentful field type.
   *
   * Supports: Symbol, Text, Integer, Number, Boolean, Date,
   * Link (Entry/Asset), Array (of Links), RichText, Object, Location.
   */
  private transformValue(
    value: any,
    mapping: FieldMapping,
    fieldDef?: ContentfulField
  ): any {
    const strValue = typeof value === "string" ? value.trim() : String(value);

    // If we don't know the field type, do basic transforms
    if (!fieldDef) {
      return typeof value === "string" ? value.trim() : value;
    }

    switch (fieldDef.type) {
      // ── Scalars ──────────────────────────────────────────────
      case "Symbol":
      case "Text":
        return strValue;

      case "Integer":
        return toInteger(value);

      case "Number":
        return toNumber(value);

      case "Boolean":
        return toBoolean(value);

      case "Date":
        // Pass through – Contentful accepts ISO-8601 strings
        return strValue;

      // ── Reference (Link to Entry or Asset) ──────────────────
      case "Link": {
        if (fieldDef.linkType === "Asset") {
          // If it looks like a URL, treat as asset ID for now
          // (full URL upload would require async asset creation)
          return toAssetLink(strValue);
        }
        // Entry link
        if (isLookup(strValue)) {
          // Lookup references are resolved during import (see resolveLookupsInRow)
          const lookup = parseLookup(strValue);
          // Store as a marker; resolved before entry creation
          return { __lookup: true, ...lookup, linkType: "Entry" };
        }
        return toEntryLink(strValue);
      }

      // ── Array (of Links, Symbols, etc.) ─────────────────────
      case "Array": {
        const itemsType = fieldDef.items?.type;
        const itemsLinkType = fieldDef.items?.linkType;

        if (itemsType === "Link" && itemsLinkType === "Asset") {
          return toAssetLinks(strValue);
        }
        if (itemsType === "Link") {
          return toEntryLinks(strValue);
        }
        // Array of Symbols (tags, etc.)
        return strValue
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }

      // ── Rich Text ───────────────────────────────────────────
      case "RichText":
        return markdownToRichText(strValue);

      // ── JSON Object ─────────────────────────────────────────
      case "Object":
        return toJsonObject(strValue);

      // ── Location ────────────────────────────────────────────
      case "Location":
        return toLocation(strValue);

      // ── Fallback ────────────────────────────────────────────
      default:
        return typeof value === "string" ? value.trim() : value;
    }
  }

  /**
   * Resolve any lookup references in a fields object by querying Contentful.
   * Replaces { __lookup: true, field, value, linkType } markers with real Link objects.
   */
  private async resolveLookupsInFields(
    fields: Record<string, any>,
    environment: any
  ): Promise<void> {
    for (const [fieldId, localeMap] of Object.entries(fields)) {
      for (const [locale, val] of Object.entries(localeMap as Record<string, any>)) {
        if (val && typeof val === "object" && val.__lookup) {
          const entries = await environment.getEntries({
            [`fields.${val.field}`]: val.value,
            limit: 1,
          });
          if (entries.items.length > 0) {
            (fields[fieldId] as any)[locale] = toEntryLink(entries.items[0].sys.id);
          } else {
            throw new Error(
              `Lookup failed: no entry found where ${val.field} = "${val.value}"`
            );
          }
        }
      }
    }
  }

  /**
   * Validate connection to Contentful
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.client.getSpace(this.spaceId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get available locales
   */
  async getLocales(): Promise<{ code: string; name: string; default: boolean }[]> {
    try {
      const space = await this.client.getSpace(this.spaceId);
      const environment = await space.getEnvironment(this.environmentId);
      const locales = await environment.getLocales();

      return locales.items.map((locale) => ({
        code: locale.code,
        name: locale.name,
        default: locale.default,
      }));
    } catch {
      return [{ code: "en-US", name: "English (US)", default: true }];
    }
  }
}

// Singleton instance for server-side use
let contentfulServiceInstance: ContentfulService | null = null;

export function getContentfulService(): ContentfulService {
  if (!contentfulServiceInstance) {
    contentfulServiceInstance = new ContentfulService();
  }
  return contentfulServiceInstance;
}
