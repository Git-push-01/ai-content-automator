"use server";

import { FileParserService } from "@/lib/file-parser";
import { getContentfulService } from "@/lib/contentful";
import { fetchContentTypes as fetchContentTypesDelivery, fetchContentType as fetchContentTypeDelivery } from "@/lib/contentful-delivery";
import { createAIValidationService } from "@/lib/ai-validation";
import type {
  ParsedFileResult,
  ValidationResult,
  ImportConfig,
  ImportResult,
  ContentfulContentType,
} from "@/types";

/**
 * Parse uploaded file
 */
export async function parseFile(formData: FormData): Promise<{
  success: boolean;
  data?: ParsedFileResult;
  error?: string;
}> {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const result = await FileParserService.parseFile(file);
    const structureErrors = FileParserService.validateStructure(result);

    if (structureErrors.length > 0) {
      result.errors.push(...structureErrors);
    }

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse file",
    };
  }
}

/**
 * Get content types from Contentful (using Delivery API)
 */
export async function getContentTypes(): Promise<{
  success: boolean;
  data?: ContentfulContentType[];
  error?: string;
}> {
  try {
    // Use Delivery API to fetch content types (doesn't require CMA token)
    const contentTypes = await fetchContentTypesDelivery();
    return { success: true, data: contentTypes as ContentfulContentType[] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch content types",
    };
  }
}

/**
 * Validate content and get field mappings
 */
export async function validateContent(
  parsedFile: ParsedFileResult,
  contentTypeId: string
): Promise<{
  success: boolean;
  data?: ValidationResult;
  error?: string;
}> {
  try {
    // Use Delivery API to fetch content type (doesn't require CMA token)
    const contentType = await fetchContentTypeDelivery(contentTypeId);

    if (!contentType) {
      return { success: false, error: "Content type not found" };
    }

    const aiService = createAIValidationService();
    const validation = await aiService.validateContent(parsedFile, contentType as ContentfulContentType);

    return { success: true, data: validation };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to validate content",
    };
  }
}

/**
 * Import content to Contentful
 */
export async function importContent(
  parsedFile: ParsedFileResult,
  config: ImportConfig
): Promise<{
  success: boolean;
  data?: ImportResult;
  error?: string;
}> {
  try {
    const contentful = getContentfulService();
    const result = await contentful.importContent(parsedFile.rows, config);

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import content",
    };
  }
}

/**
 * Get available locales
 */
export async function getLocales(): Promise<{
  success: boolean;
  data?: { code: string; name: string; default: boolean }[];
  error?: string;
}> {
  try {
    const contentful = getContentfulService();
    const locales = await contentful.getLocales();
    return { success: true, data: locales };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch locales",
    };
  }
}

/**
 * Test Contentful connection
 */
export async function testConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const contentful = getContentfulService();
    const isConnected = await contentful.validateConnection();

    if (!isConnected) {
      return { success: false, error: "Unable to connect to Contentful" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection test failed",
    };
  }
}
