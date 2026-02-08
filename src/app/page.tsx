import { ContentImporter } from "@/components/content-importer";
import { FileSpreadsheet, Eye } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI Content Automator</h1>
              <p className="text-xs text-muted-foreground">
                Excel/CSV to Contentful
              </p>
            </div>
          </div>
          <Link
            href="/content"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary rounded-md hover:bg-secondary/80 transition-colors"
          >
            <Eye className="h-4 w-4" />
            View Content
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="container py-8">
        <div className="mx-auto max-w-4xl">
          {/* Hero section */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Import Content to Contentful
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your spreadsheet, map your fields, and let AI help you
              import content automatically. No manual data entry required.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl mb-2">📁</div>
              <h3 className="font-medium text-sm">Drag & Drop</h3>
              <p className="text-xs text-muted-foreground">
                Excel & CSV files
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-medium text-sm">AI Mapping</h3>
              <p className="text-xs text-muted-foreground">
                Smart field detection
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl mb-2">✅</div>
              <h3 className="font-medium text-sm">Validation</h3>
              <p className="text-xs text-muted-foreground">
                Error-free imports
              </p>
            </div>
          </div>

          {/* Content Importer */}
          <ContentImporter />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>AI Content Automator — Streamline your content workflow</p>
        </div>
      </footer>
    </main>
  );
}
