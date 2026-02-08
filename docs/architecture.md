# Architecture Overview

## System Design

The AI Content Automator is built with a modern, scalable architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ File Upload │  │ Data Preview│  │ Field Mapping Editor│ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server Actions                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ parseFile   │  │ validate    │  │ importContent       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
┌─────────────────┐ ┌───────────────┐ ┌─────────────────────┐
│ File Parser     │ │ AI Validation │ │ Contentful Service  │
│ (xlsx/papaparse)│ │ (OpenAI)      │ │ (Management API)    │
└─────────────────┘ └───────────────┘ └─────────────────────┘
```

## Core Components

### Frontend Layer

- **FileUpload**: Drag-and-drop file upload with validation
- **DataPreview**: Table view of parsed spreadsheet data
- **FieldMappingEditor**: Visual field mapping interface
- **ProcessingSteps**: Progress indicator for import workflow
- **ImportResults**: Summary of import operation

### Service Layer

- **FileParserService**: Parses Excel (.xlsx, .xls) and CSV files
- **AIValidationService**: Uses OpenAI for smart field mapping
- **ContentfulService**: Manages Contentful API operations

### Data Flow

1. User uploads spreadsheet file
2. FileParserService extracts headers and rows
3. User selects target Contentful content type
4. AIValidationService suggests field mappings
5. User reviews and adjusts mappings
6. ContentfulService creates/updates entries
7. Results displayed to user

## Technology Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js 14, React 18, Tailwind CSS |
| UI Library | Shadcn/UI, Radix UI                |
| Backend    | Next.js Server Actions             |
| Parsing    | xlsx, papaparse                    |
| AI         | OpenAI GPT-4                       |
| CMS        | Contentful Management API          |
| Deploy     | Vercel                             |
