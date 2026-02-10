/**
 * Script to create content types in Contentful
 * Run with: node scripts/setup-contentful.mjs
 * 
 * Requires environment variables:
 * - CONTENTFUL_SPACE_ID
 * - CONTENTFUL_ENVIRONMENT (optional, defaults to 'master')
 * - CONTENTFUL_MANAGEMENT_TOKEN
 */

import contentful from 'contentful-management';

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID = process.env.CONTENTFUL_ENVIRONMENT || 'master';
const CMA_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

if (!SPACE_ID || !CMA_TOKEN) {
  console.error('❌ Missing required environment variables:');
  console.error('   CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN are required.');
  console.error('');
  console.error('Run with: CONTENTFUL_SPACE_ID=xxx CONTENTFUL_MANAGEMENT_TOKEN=xxx node scripts/setup-contentful.mjs');
  process.exit(1);
}

async function main() {
  console.log('🚀 Setting up Contentful content types...');
  
  const client = contentful.createClient({
    accessToken: CMA_TOKEN
  });

  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  // Create Article content type
  console.log('📝 Creating Article content type...');
  try {
    const articleType = await environment.createContentTypeWithId('article', {
      name: 'Article',
      description: 'Blog article or news post',
      displayField: 'title',
      fields: [
        {
          id: 'title',
          name: 'Title',
          type: 'Symbol',
          required: true,
          localized: false
        },
        {
          id: 'slug',
          name: 'Slug',
          type: 'Symbol',
          required: true,
          localized: false,
          validations: [{ unique: true }]
        },
        {
          id: 'author',
          name: 'Author',
          type: 'Symbol',
          required: true,
          localized: false
        },
        {
          id: 'category',
          name: 'Category',
          type: 'Symbol',
          required: false,
          localized: false
        },
        {
          id: 'excerpt',
          name: 'Excerpt',
          type: 'Text',
          required: false,
          localized: false
        },
        {
          id: 'content',
          name: 'Content',
          type: 'Text',
          required: false,
          localized: false
        },
        {
          id: 'status',
          name: 'Status',
          type: 'Symbol',
          required: false,
          localized: false,
          validations: [{ in: ['draft', 'published', 'archived'] }]
        },
        {
          id: 'publishDate',
          name: 'Publish Date',
          type: 'Date',
          required: false,
          localized: false
        },
        {
          id: 'tags',
          name: 'Tags',
          type: 'Symbol',
          required: false,
          localized: false
        }
      ]
    });
    await articleType.publish();
    console.log('✅ Article content type created and published!');
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  Article content type already exists');
    } else {
      console.error('❌ Error creating Article:', error.message);
    }
  }

  // Create Team Member content type
  console.log('👤 Creating Team Member content type...');
  try {
    const teamMemberType = await environment.createContentTypeWithId('teamMember', {
      name: 'Team Member',
      description: 'Team member profile',
      displayField: 'name',
      fields: [
        {
          id: 'name',
          name: 'Name',
          type: 'Symbol',
          required: true,
          localized: false
        },
        {
          id: 'email',
          name: 'Email',
          type: 'Symbol',
          required: true,
          localized: false,
          validations: [{ regexp: { pattern: '^\\S+@\\S+\\.\\S+$' } }]
        },
        {
          id: 'role',
          name: 'Role',
          type: 'Symbol',
          required: true,
          localized: false
        },
        {
          id: 'department',
          name: 'Department',
          type: 'Symbol',
          required: false,
          localized: false
        },
        {
          id: 'bio',
          name: 'Bio',
          type: 'Text',
          required: false,
          localized: false
        },
        {
          id: 'phone',
          name: 'Phone',
          type: 'Symbol',
          required: false,
          localized: false
        },
        {
          id: 'linkedIn',
          name: 'LinkedIn',
          type: 'Symbol',
          required: false,
          localized: false
        },
        {
          id: 'twitter',
          name: 'Twitter',
          type: 'Symbol',
          required: false,
          localized: false
        },
        {
          id: 'startDate',
          name: 'Start Date',
          type: 'Date',
          required: false,
          localized: false
        }
      ]
    });
    await teamMemberType.publish();
    console.log('✅ Team Member content type created and published!');
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  Team Member content type already exists');
    } else {
      console.error('❌ Error creating Team Member:', error.message);
    }
  }

  // Create Product content type
  console.log('📦 Creating Product content type...');
  try {
    const productType = await environment.createContentTypeWithId('product', {
      name: 'Product',
      description: 'Product listing',
      displayField: 'name',
      fields: [
        {
          id: 'name',
          name: 'Name',
          type: 'Symbol',
          required: true,
          localized: false
        },
        {
          id: 'sku',
          name: 'SKU',
          type: 'Symbol',
          required: true,
          localized: false,
          validations: [{ unique: true }]
        },
        {
          id: 'price',
          name: 'Price',
          type: 'Number',
          required: true,
          localized: false
        },
        {
          id: 'category',
          name: 'Category',
          type: 'Symbol',
          required: true,
          localized: false
        },
        {
          id: 'description',
          name: 'Description',
          type: 'Text',
          required: false,
          localized: false
        },
        {
          id: 'inStock',
          name: 'In Stock',
          type: 'Boolean',
          required: false,
          localized: false
        },
        {
          id: 'quantity',
          name: 'Quantity',
          type: 'Integer',
          required: false,
          localized: false
        },
        {
          id: 'brand',
          name: 'Brand',
          type: 'Symbol',
          required: false,
          localized: false
        },
        {
          id: 'rating',
          name: 'Rating',
          type: 'Number',
          required: false,
          localized: false,
          validations: [{ range: { min: 0, max: 5 } }]
        }
      ]
    });
    await productType.publish();
    console.log('✅ Product content type created and published!');
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  Product content type already exists');
    } else {
      console.error('❌ Error creating Product:', error.message);
    }
  }

  console.log('\n🎉 Setup complete! Content types are ready in your UAT environment.');
  console.log('📋 Created content types: article, teamMember, product');
  console.log('\n👉 Now go to http://localhost:3000 and upload a sample CSV to test the importer!');
}

main().catch(console.error);
