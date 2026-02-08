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

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // Account for header row and 0-indexing

        try {
          const fields = this.mapRowToFields(row, config);
          
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
    config: ImportConfig
  ): Record<string, any> {
    const fields: Record<string, any> = {};
    const locale = config.locale || "en-US";

    for (const mapping of config.fieldMappings) {
      const sourceValue = row[mapping.sourceField];
      
      if (sourceValue !== null && sourceValue !== undefined) {
        fields[mapping.targetField] = {
          [locale]: this.transformValue(sourceValue, mapping),
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
   * Transform value based on mapping configuration
   */
  private transformValue(value: any, mapping: FieldMapping): any {
    // Basic transformations
    if (typeof value === "string") {
      return value.trim();
    }
    return value;
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
