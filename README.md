# AI Content Automator

A Next.js application that automates importing spreadsheet data (Excel and CSV) into [Contentful](https://www.contentful.com/), powered by **OpenAI GPT-4o** for intelligent field mapping and data validation. Upload a file, let the AI figure out which columns map to which CMS fields, review the suggestions, and bulk-import — all from a single browser tab.

---

## Table of Contents

- [What It Does](#what-it-does)
- [How It Works](#how-it-works)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Contentful Setup](#contentful-setup)
- [Running the App](#running-the-app)
- [Usage Guide (Step-by-Step)](#usage-guide-step-by-step)
- [Sample Data](#sample-data)
- [Token Budget & Cost Control](#token-budget--cost-control)
- [Content Viewer Page](#content-viewer-page)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [License](#license)

---

## What It Does

Content teams frequently maintain data in spreadsheets (Excel or CSV) — articles, products, team bios, etc. Manually creating each of those rows as a Contentful entry is tedious and error-prone. **AI Content Automator** eliminates that manual work:

1. You upload a spreadsheet.
2. The app parses it, detects the headers, and presents a preview of the data.
3. You pick the Contentful content type you want to import into.
4. **OpenAI GPT-4o** analyzes the column names from your spreadsheet and the field definitions from your Contentful content type and automatically suggests the best column-to-field mappings, each with a confidence score.
5. You review the suggested mappings, adjust any that need changes, and confirm.
6. The app validates every row against the target content type (checking required fields, data types, etc.) and surfaces errors / warnings before anything is written.
7. On confirmation the app creates the entries in Contentful via the Management API, optionally publishing them immediately.
8. A results summary shows exactly which rows succeeded, which failed, and links to the created entries in the Contentful web app.

---

## How It Works

```
┌────────────────────────────────────────────────────────────────┐
│                       Next.js Frontend                         │
│   FileUpload ─► DataPreview ─► FieldMappingEditor ─► Results   │
└────────────────────────────────────────────────────────────────┘
                              │
                     Server Actions (RSC)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
   ┌──────────────────┐ ┌──────────────┐ ┌────────────────────┐
   │  File Parser      │ │ AI Validation│ │ Contentful Service │
   │ (xlsx / papaparse)│ │   (OpenAI)   │ │ (Management API)   │
   └──────────────────┘ └──────────────┘ └────────────────────┘
```

### Data Flow (detailed)

| Step | What happens | Where it runs |
|------|-------------|---------------|
| 1. **File upload** | User drags & drops a `.csv`, `.xlsx`, or `.xls` file (up to 10 MB). The `FileUpload` component uses `react-dropzone`. | Client |
| 2. **Parsing** | A Next.js Server Action (`parseFile`) receives the file as `FormData`. `FileParserService` uses `papaparse` for CSV and the `xlsx` library for Excel files to extract headers and rows. Basic structure validation runs here (empty files, missing headers, etc.). | Server |
| 3. **Content type selection** | The app fetches all content types from Contentful (via the Delivery API) and presents them in a dropdown. The user picks the target content type. | Server + Client |
| 4. **AI field mapping** | The `validateContent` Server Action sends the spreadsheet headers and content-type field definitions to OpenAI GPT-4o. The model returns a JSON array of `{ sourceField, targetField, confidence, transformRequired, transformDescription }` objects. If the AI call fails or the token budget is exhausted, a deterministic fallback matcher (normalized string comparison) is used instead. | Server |
| 5. **User review** | The `FieldMappingEditor` component displays every mapping with its confidence score. Users can change or remove mappings. | Client |
| 6. **Row-level validation** | Each row is checked against the content-type schema — required fields, type coercion for booleans/numbers/dates, and custom validations from Contentful. Errors and warnings are surfaced to the user. | Server |
| 7. **Import** | The `ContentfulService` iterates over every row, builds a properly localized `fields` object, and calls `environment.createEntry()`. If the user opted to publish, each entry is also published immediately. Progress is reported back to the client. | Server |
| 8. **Results** | The `ImportResults` component shows created / failed counts and links to each entry in the Contentful web app. | Client |

---

## Features

| Feature | Description |
|---------|-------------|
| **Drag & Drop Upload** | Support for `.xlsx`, `.xls`, and `.csv` files up to 10 MB via `react-dropzone`. |
| **AI-Powered Field Mapping** | GPT-4o analyzes column headers and CMS field names to suggest the best mappings with confidence scores (0–1). |
| **Deterministic Fallback** | If the AI call fails or the token budget is exceeded, a string-similarity matcher kicks in automatically. |
| **Data Validation** | Every row is validated against the content-type schema before import — required fields, type checks, and Contentful validations. |
| **Batch Import** | Create dozens or hundreds of entries in a single operation. |
| **Real-time Progress** | A step-by-step progress bar (`ProcessingSteps` component) shows parsing → mapping → validating → importing → complete. |
| **Publish Control** | Choose to publish entries immediately or save them as drafts. |
| **Dry Run / Demo Mode** | Toggle a "dry run" switch to simulate the import without writing to Contentful — perfect for demos. |
| **Content Viewer** | A dedicated `/content` page fetches all published entries from Contentful (via the Delivery API) and displays them in a browsable UI. |
| **Token Budget Tracker** | Built-in guardrails that cap OpenAI token usage and estimated cost per session, configurable via environment variables. |
| **Locale Support** | Pick a locale before importing; defaults to `en-US`. |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router, Server Actions) |
| Language | TypeScript |
| UI Components | [Shadcn/UI](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| File Parsing | [`xlsx`](https://www.npmjs.com/package/xlsx) (Excel), [`papaparse`](https://www.papaparse.com/) (CSV) |
| CMS | [Contentful Management API](https://www.contentful.com/developers/docs/references/content-management-api/) + [Delivery API](https://www.contentful.com/developers/docs/references/content-delivery-api/) |
| AI | [OpenAI GPT-4o](https://platform.openai.com/) via the official Node SDK |
| Validation | [Zod](https://zod.dev/) |
| Deployment | Vercel-ready |

---

## Project Structure

```
ai-content-automator/
├── public/                         # Static assets
├── sample-data/                    # Demo CSV files ready to import
│   ├── articles.csv                # 8 sample articles
│   ├── products.csv                # 8 sample products
│   └── team-members.csv            # 8 sample team members
├── scripts/
│   └── setup-contentful.mjs        # One-time script to create content types in Contentful
├── src/
│   ├── app/
│   │   ├── page.tsx                # Home page — renders ContentImporter
│   │   ├── layout.tsx              # Root layout (font, metadata, Toaster)
│   │   ├── actions.ts              # Server Actions (parseFile, getContentTypes, validateContent, importContent, etc.)
│   │   ├── globals.css             # Tailwind + custom CSS variables
│   │   └── content/
│   │       ├── page.tsx            # /content — displays imported entries from Contentful
│   │       └── content-display.tsx # Client component for the content viewer
│   ├── components/
│   │   ├── content-importer.tsx    # Main orchestrator component (state machine for the full workflow)
│   │   ├── file-upload.tsx         # Drag & drop upload area (react-dropzone)
│   │   ├── data-preview.tsx        # Table preview of parsed rows
│   │   ├── field-mapping.tsx       # AI-suggested field mapping editor
│   │   ├── processing-steps.tsx    # Step indicator with progress bar
│   │   ├── import-results.tsx      # Post-import summary with links
│   │   └── ui/                     # Shadcn/UI primitives (Button, Card, Progress, Toast, etc.)
│   ├── lib/
│   │   ├── file-parser.ts          # FileParserService — CSV & Excel parsing + structure validation
│   │   ├── ai-validation.ts        # AIValidationService — GPT-4o field mapping + row validation
│   │   ├── contentful.ts           # ContentfulService — Management API (create/publish entries)
│   │   ├── contentful-delivery.ts  # Delivery API helpers (read content types & entries)
│   │   ├── token-budget.ts         # TokenBudgetTracker — caps token usage and cost
│   │   └── utils.ts                # General utility functions (cn, etc.)
│   └── types/
│       └── index.ts                # Shared TypeScript interfaces
├── tests/                          # Test files
├── docs/                           # Technical documentation
│   ├── architecture.md             # System design overview
│   └── contentful-setup.md         # Step-by-step Contentful setup guide
├── .env.example                    # Environment variable template
├── components.json                 # Shadcn/UI config
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** — [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- A **Contentful** account (free Community plan works) — [Sign up](https://www.contentful.com/sign-up/)
- An **OpenAI** API key with access to GPT-4o — [Get one](https://platform.openai.com/api-keys)

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/ai-content-automator.git
cd ai-content-automator

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env.local
```

---

## Environment Variables

Create a `.env.local` file in the project root (or edit the one from the step above) with the following values:

```env
# ── Contentful ─────────────────────────────────────────────────
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_MANAGEMENT_TOKEN=your_management_token     # Required for importing
CONTENTFUL_DELIVERY_TOKEN=your_delivery_token          # Required for reading content types & viewing entries

# Client-side variables (used by the /content viewer page)
NEXT_PUBLIC_CONTENTFUL_SPACE_ID=your_space_id
NEXT_PUBLIC_CONTENTFUL_DELIVERY_TOKEN=your_delivery_token

# ── OpenAI ─────────────────────────────────────────────────────
OPENAI_API_KEY=your_openai_api_key

# ── Token Budget (optional) ────────────────────────────────────
OPENAI_MAX_TOKENS=100000            # Max total tokens per session (default: 100 000)
OPENAI_MAX_COST_USD=1.00            # Max estimated cost in USD (default: $1.00)
OPENAI_WARNING_THRESHOLD=0.8        # Warning at 80% of budget (default: 0.8)

# ── Optional ───────────────────────────────────────────────────
NEXT_PUBLIC_CONTENTFUL_WEB_URL=https://app.contentful.com
```

### Where to find these values

| Variable | Where to get it |
|----------|----------------|
| `CONTENTFUL_SPACE_ID` | Contentful → Settings → General settings |
| `CONTENTFUL_MANAGEMENT_TOKEN` | Contentful → Settings → API keys → Content management tokens → Generate personal token |
| `CONTENTFUL_DELIVERY_TOKEN` | Contentful → Settings → API keys → Add API key → Content Delivery API access token |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |

---

## Contentful Setup

You need at least one content type in your Contentful space. The project includes both a **setup script** and **sample data** to get you started quickly.

### Option A: Automated Setup (recommended)

Run the included script to create three demo content types (`article`, `teamMember`, `product`):

```bash
CONTENTFUL_SPACE_ID=xxx CONTENTFUL_MANAGEMENT_TOKEN=xxx node scripts/setup-contentful.mjs
```

This creates the content types and publishes them so they're immediately available.

### Option B: Manual Setup

Follow the detailed guide in [docs/contentful-setup.md](docs/contentful-setup.md), which walks you through creating each content type field-by-field in the Contentful web app.

### Content Types Created

| Content Type | ID | Fields |
|---|---|---|
| **Article** | `article` | title, slug, description, author, category, publishDate, featured |
| **Team Member** | `teamMember` | name, role, email, department, bio, startDate, active |
| **Product** | `product` | productName, sku, price, category, description, inStock, rating |

---

## Running the App

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## Usage Guide (Step-by-Step)

### 1. Upload a Spreadsheet

Navigate to [http://localhost:3000](http://localhost:3000). You'll see a drag-and-drop zone in the center of the page.

- **Drag & drop** a `.csv`, `.xlsx`, or `.xls` file onto the upload area, or click to browse.
- Maximum file size: **10 MB**.
- The file is sent to the server and parsed immediately. You'll see a toast notification confirming the number of rows and columns detected.

### 2. Preview Your Data

After parsing, a **data table** shows the first rows of your spreadsheet so you can confirm the data looks correct. Column headers are displayed across the top.

### 3. Select a Content Type

A dropdown appears listing all content types available in your Contentful space. Pick the one you want to import into (e.g., **Article**, **Product**, **Team Member**).

### 4. AI Field Mapping

Click **"Validate & Map Fields"**. The app sends your column headers and the content-type field definitions to OpenAI GPT-4o. Within a few seconds, the **Field Mapping Editor** appears showing:

- **Source column** (from your spreadsheet) → **Target field** (in Contentful)
- A **confidence score** (0.0 – 1.0) for each mapping
- Whether a **data transform** is needed (e.g., converting `"true"/"false"` strings to booleans)

You can:
- Change any mapping via the dropdown
- Remove mappings you don't want
- See warnings for required fields that don't have a confident match

### 5. Configure Import Options

Before importing you can adjust:

| Option | Description | Default |
|--------|-------------|---------|
| **Locale** | Which Contentful locale to write to | `en-US` |
| **Publish immediately** | Publish entries right after creation, or leave as drafts | Off (drafts) |
| **Dry run** | Simulate the import without actually writing to Contentful | On |

### 6. Import

Click **"Import to Contentful"**. A progress bar walks through each row:

```
Parsing → Validating → Mapping → Importing → Complete
```

Each entry is created via the Contentful Management API. If "Publish immediately" is enabled, each entry is also published after creation.

### 7. Review Results

When the import finishes, the **Import Results** panel shows:

- **Total processed** rows
- **Created** count
- **Failed** count (with error details per row)
- Links to view each entry in the Contentful web app

---

## Sample Data

The `sample-data/` folder contains three CSV files you can use right away:

| File | Content Type | Rows | Columns |
|------|-------------|------|---------|
| `articles.csv` | Article | 8 | title, slug, description, author, category, publishDate, featured |
| `products.csv` | Product | 8 | productName, sku, price, category, description, inStock, rating |
| `team-members.csv` | Team Member | 8 | name, role, email, department, bio, startDate, active |

These are designed to map perfectly to the content types created by the setup script.

---

## Token Budget & Cost Control

The app includes a built-in **Token Budget Tracker** (`src/lib/token-budget.ts`) that prevents runaway OpenAI costs:

- **Max tokens per session** — Defaults to 100,000; configurable via `OPENAI_MAX_TOKENS`.
- **Max cost per session** — Defaults to $1.00; configurable via `OPENAI_MAX_COST_USD`.
- **Warning threshold** — Logs a warning when usage reaches 80% of the budget (configurable via `OPENAI_WARNING_THRESHOLD`).

If the budget is exceeded, the AI mapping call is skipped and the **deterministic fallback** mapper is used instead (normalized string comparison of column names to field IDs/names). The import continues without interruption.

Token usage and estimated cost are logged to the server console after each GPT-4o call:

```
📊 Tokens: 1,250 / 100,000 | Cost: $0.0156 / $1.00 | Calls: 1
```

---

## Content Viewer Page

After importing, navigate to [http://localhost:3000/content](http://localhost:3000/content) to browse all published entries from your Contentful space. This page:

- Fetches all content types and their entries via the **Contentful Delivery API**
- Groups entries by content type
- Displays field data in a clean, readable layout
- Provides a link back to the importer

> **Note:** This page only shows **published** entries. If you imported as drafts, publish them in Contentful first.

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Then add all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Other Platforms

The app is a standard Next.js 14 application. It can be deployed anywhere that supports Node.js 18+:

- **Docker** — Use the official Next.js Dockerfile
- **AWS Amplify** — Connect your Git repo
- **Railway / Render** — Add as a Node.js service

Make sure all environment variables from the [Environment Variables](#environment-variables) section are set in your hosting platform.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **"Missing credentials" error** | Ensure all `CONTENTFUL_*` and `OPENAI_API_KEY` variables are set in `.env.local`. Restart the dev server after changes. |
| **Content types not appearing in dropdown** | Make sure the content types are **published** in Contentful (not just saved). Verify the Delivery Token has access to the space. |
| **AI mapping returns low confidence** | The AI works best when column headers are descriptive (e.g., "Product Name" maps better than "col_a"). You can always adjust mappings manually. |
| **Import fails for some rows** | Check the results panel for per-row error details. Common causes: missing required fields, invalid date formats, or type mismatches. |
| **Token budget exceeded** | The fallback mapper will be used automatically. To increase the budget, raise `OPENAI_MAX_TOKENS` or `OPENAI_MAX_COST_USD` in `.env.local`. |
| **`/content` page shows no entries** | Entries must be **published** to appear via the Delivery API. Import with "Publish immediately" enabled, or publish drafts from the Contentful web app. |
| **Excel file parsing fails** | Ensure the file has data in the **first sheet**. The parser only reads Sheet 1. Headers must be in the first row. |

---

## Documentation

- [Architecture Overview](docs/architecture.md) — System design, component breakdown, and data flow diagrams
- [Contentful Setup Guide](docs/contentful-setup.md) — Step-by-step instructions for configuring your Contentful space

---

## License

MIT
