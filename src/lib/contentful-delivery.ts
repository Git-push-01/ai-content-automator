import { createClient } from "contentful";

// Delivery client for reading published content
export function getContentfulDeliveryClient() {
  const spaceId = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID || process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.NEXT_PUBLIC_CONTENTFUL_DELIVERY_TOKEN || process.env.CONTENTFUL_DELIVERY_TOKEN;

  if (!spaceId || !accessToken) {
    throw new Error("Missing Contentful delivery credentials");
  }

  return createClient({
    space: spaceId,
    accessToken: accessToken,
    environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
  });
}

// Fetch entries by content type
export async function fetchEntries(contentType: string, limit = 100) {
  const client = getContentfulDeliveryClient();
  
  const entries = await client.getEntries({
    content_type: contentType,
    limit,
    order: ["-sys.createdAt"],
  });

  return entries.items.map((item) => ({
    id: item.sys.id,
    createdAt: item.sys.createdAt,
    updatedAt: item.sys.updatedAt,
    contentType: item.sys.contentType.sys.id,
    fields: item.fields,
  }));
}

// Fetch all content types
export async function fetchContentTypes() {
  const client = getContentfulDeliveryClient();
  const contentTypes = await client.getContentTypes();

  return contentTypes.items.map((ct) => ({
    id: ct.sys.id,
    name: ct.name,
    description: ct.description,
    fieldCount: ct.fields.length,
  }));
}

// Fetch single entry by ID
export async function fetchEntry(entryId: string) {
  const client = getContentfulDeliveryClient();
  const entry = await client.getEntry(entryId);

  return {
    id: entry.sys.id,
    createdAt: entry.sys.createdAt,
    updatedAt: entry.sys.updatedAt,
    contentType: entry.sys.contentType.sys.id,
    fields: entry.fields,
  };
}
