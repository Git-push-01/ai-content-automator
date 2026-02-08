import { fetchContentTypes, fetchEntries } from "@/lib/contentful-delivery";
import { ContentDisplay } from "./content-display";
import { FileSpreadsheet, RefreshCw } from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Always fetch fresh data

async function getContentData() {
  try {
    const contentTypes = await fetchContentTypes();
    
    // Fetch entries for each content type
    const entriesPerType: Record<string, any[]> = {};
    
    for (const ct of contentTypes) {
      try {
        const entries = await fetchEntries(ct.id, 50);
        entriesPerType[ct.id] = entries;
      } catch {
        entriesPerType[ct.id] = [];
      }
    }

    return { contentTypes, entriesPerType, error: null };
  } catch (error) {
    return { 
      contentTypes: [], 
      entriesPerType: {}, 
      error: error instanceof Error ? error.message : "Failed to fetch content" 
    };
  }
}

export default async function ContentPage() {
  const { contentTypes, entriesPerType, error } = await getContentData();

  const totalEntries = Object.values(entriesPerType).reduce(
    (sum, entries) => sum + entries.length,
    0
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">AI Content Automator</h1>
                <p className="text-xs text-muted-foreground">Content Display</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{totalEntries}</span> entries
              {" · "}
              <span className="font-medium text-foreground">{contentTypes.length}</span> content types
            </div>
            <Link
              href="/content"
              className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary rounded-md hover:bg-secondary/80 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Import More
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container py-8">
        {error ? (
          <div className="max-w-2xl mx-auto">
            <div className="p-8 rounded-lg border border-destructive/50 bg-destructive/10 text-center">
              <p className="text-lg font-medium text-destructive mb-2">
                Unable to connect to Contentful
              </p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <p className="text-sm text-muted-foreground">
                Make sure you&apos;ve set up your{" "}
                <code className="px-1.5 py-0.5 bg-muted rounded">CONTENTFUL_DELIVERY_TOKEN</code>
                {" "}in <code className="px-1.5 py-0.5 bg-muted rounded">.env.local</code>
              </p>
            </div>
          </div>
        ) : contentTypes.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-semibold mb-2">No content types found</h2>
            <p className="text-muted-foreground mb-4">
              Set up content types in Contentful first, then import some data.
            </p>
            <Link
              href="/"
              className="inline-flex px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Go to Importer
            </Link>
          </div>
        ) : (
          <ContentDisplay
            contentTypes={contentTypes}
            entriesPerType={entriesPerType}
          />
        )}
      </div>
    </main>
  );
}
