# Directus Expandable Blocks API

A focused Directus API extension for tracking item usage across M2A (Many-to-Any) relationships. This extension provides functionality that the native Directus API cannot offer - specifically tracking where items are used throughout your content structure.

## Purpose

**"The API should only do what the native Directus API cannot."**

This extension focuses exclusively on relation/usage tracking - finding where content items are referenced across different collections through M2A junction tables.

## Key Features

- **Usage Tracking**: Track where items are used across M2A relationships
- **Junction ID Support**: Returns junction table IDs for proper relationship management
- **Batch Operations**: Optimized queries for loading multiple items efficiently
- **Performance Focused**: Reduced database queries through batch loading
- **Minimal Surface Area**: Only essential endpoints, reducing maintenance burden

## Installation

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Copy to your Directus extensions folder
cp -r dist /path/to/directus/extensions/expandable-blocks-api
```

## API Endpoints

### Health Check
```http
GET /expandable-blocks/health
```

Returns the API status and version information.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "description": "Expandable Blocks API - Relation/Usage Tracking"
}
```

### Detail with Usage Tracking
```http
POST /expandable-blocks/:collection/detail
```

Load items with comprehensive usage information across M2A relationships. This is the core functionality that native Directus API cannot provide.

**Request Body:**
```json
{
  "ids": [1, 2, 3],
  "fields": "id,name,status"  // Optional field selection
}
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Item Name",
      "status": "published",
      "usage_locations": [
        {
          "id": 10,
          "collection": "pages",
          "title": "Homepage",
          "status": "published",
          "field": "content",
          "sort": 1,
          "path": "/home",
          "edit_url": "/admin/content/pages/10",
          "junction_id": 101  // Critical for relationship management
        }
      ],
      "usage_summary": {
        "total_count": 1,
        "by_collection": { "pages": 1 },
        "by_status": { "published": 1 },
        "by_field": { "content": 1 }
      }
    }
  ],
  "meta": {
    "collection": "content_blocks",
    "total_count": 1,
    "timestamp": "2025-01-27T10:00:00.000Z"
  }
}
```

## Usage Tracking

The API tracks usage across multiple junction tables:

- **pages_m2a**: Tracks items used in pages
- **expandable_expandable**: Tracks items used in expandable blocks
- Additional junction tables can be added as needed

Each usage location includes:
- `junction_id`: The ID in the junction table (critical for updates/deletes)
- `collection`: Where the item is used
- `title`: Human-readable reference
- `status`: Current status of the parent item
- `edit_url`: Direct link to edit the parent item

## Performance Optimizations

- **Batch Loading**: All usage data is loaded in batch queries
- **Optimized Queries**: Uses efficient SQL joins
- **Minimal Overhead**: Only loads what's necessary
- **Single Round-Trip**: Reduces database queries significantly

## Requirements

- Directus v11.0.0 or higher
- Expandable Blocks interface extension
- Node.js 16 or higher

## Development

```bash
# Install dependencies
npm install

# Development mode with auto-reload
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Architecture

```
src/
├── index.ts                 # Main endpoint definition (2 endpoints only)
├── handlers/
│   └── DetailHandler.ts     # Core usage tracking logic
├── factories/
│   └── ServiceFactory.ts    # Service instantiation
├── middleware/
│   ├── error-handler.ts     # Error handling
│   ├── rate-limit.ts        # Rate limiting
│   └── security-headers.ts  # Security headers
└── types/                   # TypeScript definitions
```

## Philosophy

This extension follows the principle of doing only what Directus cannot do natively. By focusing exclusively on relation/usage tracking, we maintain:

- **Less code** = Less maintenance = Fewer bugs
- **Clear purpose** = Easier to understand
- **Focused functionality** = Better performance
- **Minimal API surface** = Reduced security risk

## License

MIT License - see LICENSE file for details

## Support

For issues, feature requests, or questions:
- Create an issue on [GitHub](https://github.com/smartlabsAT/directus-expandable-blocks-api/issues)
- Check the [Expandable Blocks documentation](https://github.com/smartlabsAT/directus-expandable-blocks)

## Credits

Developed by [SmartLabs AT](https://smartlabs.at) for the Directus community.