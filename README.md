# Directus Expandable Blocks API

API endpoint extension for the [Directus Expandable Blocks](https://github.com/smartlabsAT/directus-expandable-blocks) interface extension.

## Overview

This extension provides advanced relationship tracking and usage management for the Expandable Blocks interface. It adds critical functionality for safely managing M2A (Many-to-Any) relationships by tracking where items are used across your Directus instance.

## Key Features

- **Usage Tracking**: Track where each block is used across collections
- **Safe Deletion**: Prevent accidental deletion of blocks that are in use
- **Relationship Analysis**: Understand the connections between your content
- **Junction Support**: Handle complex M2A relationships with junction tables
- **Performance Optimized**: Efficient queries with caching support

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
```
GET /expandable-blocks-api/health
```
Verify the API is running and accessible.

### Collection Metadata
```
GET /expandable-blocks-api/:collection/metadata
```
Retrieve metadata about a collection including field information and display configuration.

### Search Items
```
GET /expandable-blocks-api/:collection/search
```
Search for items within a collection with filtering and pagination support.

**Query Parameters:**
- `search` - Search term
- `limit` - Number of results (default: 10)
- `page` - Page number for pagination
- `filter` - Additional filter criteria

### Item Details with Usage
```
POST /expandable-blocks-api/:collection/detail
```
Get detailed information about items including their usage locations.

**Request Body:**
```json
{
  "ids": ["item-id-1", "item-id-2"],
  "fields": ["*.*"]
}
```

**Response:**
```json
{
  "data": [{
    "id": "item-id",
    "usage_locations": [
      {
        "collection": "pages",
        "id": "page-1",
        "field": "content_blocks",
        "title": "Homepage",
        "junction_id": "junction-123"
      }
    ],
    "usage_summary": {
      "total_count": 3,
      "can_delete": false
    }
  }]
}
```

## How It Works

The API extension works in conjunction with the Expandable Blocks interface to provide:

1. **Relationship Detection**: Automatically discovers M2A relationships and junction tables
2. **Usage Analysis**: Tracks where each block is referenced across all collections
3. **Safe Operations**: Prevents breaking content by warning about existing usages
4. **Junction Resolution**: Properly handles junction table relationships with unique identifiers

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

## Configuration

The extension automatically detects M2A relationships in your Directus schema. No additional configuration is required for basic usage.

## Use Cases

- **Content Management**: Track which pages use specific content blocks
- **Asset Management**: Know where images and videos are embedded
- **Safe Deletion**: Get warnings before deleting items that are in use
- **Content Auditing**: Understand content relationships and dependencies

## License

MIT License - see LICENSE file for details

## Support

For issues, feature requests, or questions:
- Create an issue on [GitHub](https://github.com/smartlabsAT/directus-expandable-blocks-api/issues)
- Check the [Expandable Blocks documentation](https://github.com/smartlabsAT/directus-expandable-blocks)

## Credits

Developed by [SmartLabs AT](https://smartlabs.at) for the Directus community.