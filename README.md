# AI Content Automator

A Next.js application that automates importing Excel and CSV data into Contentful, powered by AI for smart field mapping and validation.

## Features

- **Drag & Drop Upload** — Support for Excel (.xlsx, .xls) and CSV files up to 10MB
- **AI-Powered Field Mapping** — Automatically suggests mappings between spreadsheet columns and Contentful fields
- **Data Validation** — Validates content before import with clear error messages
- **Batch Import** — Create multiple Contentful entries in one operation
- **Real-time Progress** — Visual feedback during the import process
- **Publish Control** — Option to publish immediately or save as drafts

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: Shadcn/UI + Tailwind CSS
- **File Parsing**: xlsx, papaparse
- **CMS**: Contentful Management API
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel-ready

## Project Structure

```
ai-content-automator/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Main application page
│   │   ├── layout.tsx          # Root layout
│   │   ├── actions.ts          # Server actions
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── ui/                 # Shadcn/UI components
│   │   ├── file-upload.tsx     # File upload dropzone
│   │   ├── data-preview.tsx    # Data table preview
│   │   ├── field-mapping.tsx   # Field mapping editor
│   │   ├── processing-steps.tsx # Progress indicator
│   │   ├── import-results.tsx  # Import summary
│   │   └── content-importer.tsx # Main workflow component
│   ├── lib/                    # Utility functions
│   │   ├── utils.ts            # General utilities
│   │   ├── file-parser.ts      # Excel/CSV parsing
│   │   ├── contentful.ts       # Contentful SDK wrapper
│   │   └── ai-validation.ts    # AI validation service
│   └── types/                  # TypeScript types
│       └── index.ts            # Shared type definitions
├── public/                     # Static assets
├── tests/                      # Test files
├── docs/                       # Documentation
├── .env.example                # Environment template
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Contentful account with Management API access
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ai-content-automator.git
cd ai-content-automator

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Configuration

Edit `.env.local` with your credentials:

```env
# Contentful Configuration
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_MANAGEMENT_TOKEN=your_management_token

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Usage

1. **Upload your spreadsheet** — Drag and drop an Excel or CSV file
2. **Select content type** — Choose the Contentful content type to import into
3. **Review field mappings** — AI suggests mappings; adjust as needed
4. **Configure options** — Set locale and publish preferences
5. **Import** — Click import and watch the progress
6. **Review results** — See created entries with links to Contentful

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add environment variables in Vercel dashboard under Settings → Environment Variables.

## Out of Scope

- Mobile application
- Advanced authentication (SSO, OAuth, RBAC)
- Legacy proprietary file formats

## Documentation

- [Architecture](./docs/architecture.md)
- [API Reference](./docs/api.md)
- [Configuration Guide](./docs/configuration.md)

## License

MIT
