/**
 * Value Transformers for Complex Contentful Field Types
 *
 * Converts flat spreadsheet cell values into the structured formats
 * that the Contentful Management API expects.
 *
 * Spreadsheet conventions:
 *   Reference     → entry ID or "lookup:<field>:<value>"
 *   Multi-ref     → comma-separated IDs / lookups
 *   Rich Text     → Markdown string
 *   JSON Object   → raw JSON string
 *   Media / Asset → asset ID or public image URL ("url:<https://…>")
 *   Location      → "lat,lon"
 */

// ─── Reference (Link) ────────────────────────────────────────────

export interface LinkValue {
  sys: {
    type: "Link";
    linkType: "Entry" | "Asset";
    id: string;
  };
}

/**
 * Build a single Contentful Link object from a raw cell value.
 *
 * Accepted formats:
 *   "entryId123"                → direct entry ID
 *   "lookup:slug:my-article"    → will be resolved later (returns a placeholder)
 */
export function toEntryLink(value: string): LinkValue {
  return {
    sys: {
      type: "Link",
      linkType: "Entry",
      id: value.trim(),
    },
  };
}

export function toAssetLink(value: string): LinkValue {
  return {
    sys: {
      type: "Link",
      linkType: "Asset",
      id: value.trim(),
    },
  };
}

// ─── Multi-Reference (Array of Links) ────────────────────────────

/**
 * Parse a comma-separated string of entry IDs into an array of Link objects.
 *
 * Example cell: "id1, id2, id3"
 */
export function toEntryLinks(value: string): LinkValue[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((id) => toEntryLink(id));
}

export function toAssetLinks(value: string): LinkValue[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((id) => toAssetLink(id));
}

// ─── Rich Text ───────────────────────────────────────────────────

/**
 * Contentful Rich Text document node types.
 * This is a simplified Markdown → Rich Text converter that handles:
 *   - Headings (# … ######)
 *   - Paragraphs
 *   - Bold (**text**) and Italic (*text*)
 *   - Unordered lists (- item)
 *   - Ordered lists (1. item)
 *   - Blockquotes (> text)
 *   - Horizontal rules (---)
 *   - Links [text](url)
 */

interface RichTextNode {
  nodeType: string;
  data: Record<string, any>;
  content?: RichTextNode[];
  value?: string;
  marks?: { type: string }[];
}

export function markdownToRichText(markdown: string): RichTextNode {
  const lines = markdown.split("\n");
  const content: RichTextNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      content.push({ nodeType: "hr", data: {}, content: [] });
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      content.push({
        nodeType: `heading-${level}`,
        data: {},
        content: parseInlineText(headingMatch[2]),
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      content.push({
        nodeType: "blockquote",
        data: {},
        content: [
          {
            nodeType: "paragraph",
            data: {},
            content: parseInlineText(line.slice(2)),
          },
        ],
      });
      i++;
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: RichTextNode[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*[-*]\s+/, "");
        items.push({
          nodeType: "list-item",
          data: {},
          content: [
            {
              nodeType: "paragraph",
              data: {},
              content: parseInlineText(itemText),
            },
          ],
        });
        i++;
      }
      content.push({
        nodeType: "unordered-list",
        data: {},
        content: items,
      });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: RichTextNode[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*\d+\.\s+/, "");
        items.push({
          nodeType: "list-item",
          data: {},
          content: [
            {
              nodeType: "paragraph",
              data: {},
              content: parseInlineText(itemText),
            },
          ],
        });
        i++;
      }
      content.push({
        nodeType: "ordered-list",
        data: {},
        content: items,
      });
      continue;
    }

    // Default: paragraph
    content.push({
      nodeType: "paragraph",
      data: {},
      content: parseInlineText(line),
    });
    i++;
  }

  // Ensure at least one content node
  if (content.length === 0) {
    content.push({
      nodeType: "paragraph",
      data: {},
      content: [{ nodeType: "text", value: "", data: {}, marks: [] }],
    });
  }

  return {
    nodeType: "document",
    data: {},
    content,
  };
}

/**
 * Parse inline Markdown (bold, italic, links) into Rich Text text/hyperlink nodes.
 */
function parseInlineText(text: string): RichTextNode[] {
  const nodes: RichTextNode[] = [];

  // Regex to match: **bold**, *italic*, [link text](url)
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(\[(.+?)\]\((.+?)\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Add any plain text before this match
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index);
      if (plain) {
        nodes.push({
          nodeType: "text",
          value: plain,
          data: {},
          marks: [],
        });
      }
    }

    if (match[1]) {
      // Bold **text**
      nodes.push({
        nodeType: "text",
        value: match[2],
        data: {},
        marks: [{ type: "bold" }],
      });
    } else if (match[3]) {
      // Italic *text*
      nodes.push({
        nodeType: "text",
        value: match[4],
        data: {},
        marks: [{ type: "italic" }],
      });
    } else if (match[5]) {
      // Link [text](url)
      nodes.push({
        nodeType: "hyperlink",
        data: { uri: match[7] },
        content: [
          {
            nodeType: "text",
            value: match[6],
            data: {},
            marks: [],
          },
        ],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining plain text
  if (lastIndex < text.length) {
    nodes.push({
      nodeType: "text",
      value: text.slice(lastIndex),
      data: {},
      marks: [],
    });
  }

  // Ensure at least one node
  if (nodes.length === 0) {
    nodes.push({
      nodeType: "text",
      value: text,
      data: {},
      marks: [],
    });
  }

  return nodes;
}

// ─── JSON Object ─────────────────────────────────────────────────

/**
 * Parse a JSON string from a spreadsheet cell.
 * Returns the parsed object, or throws with a helpful message.
 */
export function toJsonObject(value: string): Record<string, any> {
  try {
    const parsed = JSON.parse(value.trim());
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Value must be a JSON object (not an array or primitive)");
    }
    return parsed;
  } catch (error) {
    throw new Error(
      `Invalid JSON in cell: ${error instanceof Error ? error.message : "Parse error"}. ` +
        `Expected a valid JSON object like {"key": "value"}`
    );
  }
}

// ─── Location ────────────────────────────────────────────────────

export interface LocationValue {
  lat: number;
  lon: number;
}

/**
 * Parse a "lat,lon" string into a Contentful Location object.
 *
 * Accepted formats:
 *   "40.7128,-74.0060"
 *   "40.7128, -74.0060"
 */
export function toLocation(value: string): LocationValue {
  const parts = value.split(",").map((p) => p.trim());

  if (parts.length !== 2) {
    throw new Error(
      `Invalid location format: "${value}". Expected "lat,lon" (e.g. "40.7128,-74.0060")`
    );
  }

  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);

  if (isNaN(lat) || isNaN(lon)) {
    throw new Error(
      `Invalid location coordinates: "${value}". Both lat and lon must be numbers.`
    );
  }

  if (lat < -90 || lat > 90) {
    throw new Error(`Latitude ${lat} is out of range. Must be between -90 and 90.`);
  }

  if (lon < -180 || lon > 180) {
    throw new Error(`Longitude ${lon} is out of range. Must be between -180 and 180.`);
  }

  return { lat, lon };
}

// ─── Boolean coercion ────────────────────────────────────────────

/**
 * Coerce common boolean-like strings to actual booleans.
 */
export function toBoolean(value: any): boolean {
  if (typeof value === "boolean") return value;
  const str = String(value).toLowerCase().trim();
  if (["true", "yes", "1", "y"].includes(str)) return true;
  if (["false", "no", "0", "n"].includes(str)) return false;
  throw new Error(`Cannot convert "${value}" to boolean`);
}

// ─── Number coercion ─────────────────────────────────────────────

export function toNumber(value: any): number {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Cannot convert "${value}" to a number`);
  }
  return num;
}

export function toInteger(value: any): number {
  const num = toNumber(value);
  if (!Number.isInteger(num)) {
    throw new Error(`"${value}" is not a whole number`);
  }
  return num;
}

// ─── Lookup helpers ──────────────────────────────────────────────

export interface LookupRequest {
  field: string;
  value: string;
}

/**
 * Check if a cell value is a lookup reference (e.g. "lookup:slug:my-article")
 */
export function isLookup(value: string): boolean {
  return value.trim().startsWith("lookup:");
}

/**
 * Parse a lookup string into its parts.
 * "lookup:slug:my-article" → { field: "slug", value: "my-article" }
 */
export function parseLookup(value: string): LookupRequest {
  const parts = value.trim().split(":");
  if (parts.length < 3) {
    throw new Error(
      `Invalid lookup format: "${value}". Expected "lookup:<fieldId>:<value>"`
    );
  }
  return {
    field: parts[1],
    value: parts.slice(2).join(":"), // Allow colons in the value
  };
}

/**
 * Check if a value is a URL (for asset uploads)
 */
export function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}
