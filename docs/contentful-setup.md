# Contentful Setup Guide

This guide walks you through setting up a free Contentful space for the AI Content Automator demo.

## Step 1: Create a Free Contentful Account

1. Go to [contentful.com](https://www.contentful.com/)
2. Click **"Get started for free"**
3. Sign up with email or GitHub
4. You get a free Community plan with:
   - 1 space
   - 25,000 records
   - 2 locales
   - Unlimited content types

## Step 2: Create Content Types

After logging in, go to **Content model** and create these content types:

---

### Content Type 1: Article

**ID:** `article`

| Field Name   | Field ID     | Type         | Required | Notes                    |
|--------------|--------------|--------------|----------|--------------------------|
| Title        | `title`      | Short text   | Yes      | Entry title              |
| Slug         | `slug`       | Short text   | Yes      | URL-friendly identifier  |
| Description  | `description`| Long text    | No       | Article summary          |
| Author       | `author`     | Short text   | No       | Author name              |
| Category     | `category`   | Short text   | No       | Article category         |
| Publish Date | `publishDate`| Date         | No       | Publication date         |
| Featured     | `featured`   | Boolean      | No       | Show on homepage         |

**To create:**
1. Click **"Add content type"**
2. Name: `Article`, API Identifier: `article`
3. Add each field using the **"Add field"** button
4. Click **"Save"**

---

### Content Type 2: Team Member

**ID:** `teamMember`

| Field Name   | Field ID     | Type         | Required | Notes                    |
|--------------|--------------|--------------|----------|--------------------------|
| Name         | `name`       | Short text   | Yes      | Entry title              |
| Role         | `role`       | Short text   | No       | Job title                |
| Email        | `email`      | Short text   | No       | Contact email            |
| Department   | `department` | Short text   | No       | Team/department          |
| Bio          | `bio`        | Long text    | No       | Biography                |
| Start Date   | `startDate`  | Date         | No       | Employment start         |
| Active       | `active`     | Boolean      | No       | Currently employed       |

---

### Content Type 3: Product

**ID:** `product`

| Field Name   | Field ID     | Type         | Required | Notes                    |
|--------------|--------------|--------------|----------|--------------------------|
| Product Name | `productName`| Short text   | Yes      | Entry title              |
| SKU          | `sku`        | Short text   | Yes      | Product identifier       |
| Price        | `price`      | Decimal      | No       | Price in dollars         |
| Category     | `category`   | Short text   | No       | Product category         |
| Description  | `description`| Long text    | No       | Product description      |
| In Stock     | `inStock`    | Boolean      | No       | Availability             |
| Rating       | `rating`     | Decimal      | No       | Star rating (1-5)        |

---

## Step 3: Get API Keys

### Management Token (for importing content)

1. Go to **Settings** → **API keys**
2. Click **Content management tokens** tab
3. Click **"Generate personal token"**
4. Name it: `AI Content Automator`
5. Copy the token (you won't see it again!)

### Delivery Token (for reading content)

1. In **Settings** → **API keys**
2. Click **"Add API key"**
3. Name it: `Demo Read Access`
4. Copy:
   - **Space ID**
   - **Content Delivery API - access token**

---

## Step 4: Configure Environment Variables

Create `.env.local` in your project root:

```env
# Contentful - Required
CONTENTFUL_SPACE_ID=your_space_id_here
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_MANAGEMENT_TOKEN=your_management_token_here
CONTENTFUL_DELIVERY_TOKEN=your_delivery_token_here

# For client-side display page
NEXT_PUBLIC_CONTENTFUL_SPACE_ID=your_space_id_here
NEXT_PUBLIC_CONTENTFUL_DELIVERY_TOKEN=your_delivery_token_here

# OpenAI - Required for AI field mapping
OPENAI_API_KEY=your_openai_key_here

# Optional: Contentful Web App URL for entry links
NEXT_PUBLIC_CONTENTFUL_WEB_URL=https://app.contentful.com
```

---

## Step 5: Test the Demo

1. Start the app: `npm run dev`
2. Go to `http://localhost:3000`
3. Upload one of the sample CSV files from `sample-data/`:
   - `articles.csv` → Import as **Article** content type
   - `team-members.csv` → Import as **Team Member** content type
   - `products.csv` → Import as **Product** content type
4. Watch the AI map fields automatically
5. Click Import
6. Go to `http://localhost:3000/content` to see imported data

---

## Sample Data Files

Located in `/sample-data/`:

| File               | Content Type | Records |
|--------------------|--------------|---------|
| `articles.csv`     | Article      | 8       |
| `team-members.csv` | Team Member  | 8       |
| `products.csv`     | Product      | 8       |

---

## Tips for the Demo

1. **Show before/after**: Open Contentful web app side-by-side to show entries appearing
2. **Highlight AI mapping**: Point out how the AI suggests field mappings automatically
3. **Show validation**: Upload a file with errors to demo the validation feedback
4. **Show the display page**: Navigate to `/content` to show live data from Contentful

---

## Troubleshooting

**"Missing credentials" error:**
- Check that all env variables are set in `.env.local`
- Restart the dev server after adding env vars

**Content types not showing:**
- Make sure you saved and published the content types in Contentful
- Check the Management token has correct permissions

**Import fails:**
- Verify field IDs match exactly (case-sensitive)
- Check the console for detailed error messages
