# Confluence MCP Server

[![Primrose MCP](https://img.shields.io/badge/Primrose-MCP-blue)](https://primrose.dev/mcp/confluence)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for Atlassian Confluence. Manage spaces, pages, blog posts, comments, and collaborate on wiki content through a standardized interface.

## Features

- **Space Management** - Create, list, and manage Confluence spaces
- **Page Operations** - Full CRUD operations for wiki pages
- **Blog Posts** - Create and manage blog posts
- **Comments** - Add and manage page comments
- **Attachments** - Upload and manage file attachments
- **Labels** - Organize content with labels
- **Tasks** - Manage inline tasks
- **User Management** - Access user information
- **Content Versioning** - Work with page versions and history
- **Search** - Full-text search across Confluence content

## Quick Start

The recommended way to use this MCP server is through the [Primrose SDK](https://www.npmjs.com/package/primrose-mcp):

```bash
npm install primrose-mcp
```

```typescript
import { PrimroseClient } from 'primrose-mcp';

const client = new PrimroseClient({
  service: 'confluence',
  headers: {
    'X-Confluence-Domain': 'your-company',
    'X-Confluence-Email': 'your-email@company.com',
    'X-Confluence-API-Token': 'your-api-token'
  }
});

// List all spaces
const spaces = await client.call('confluence_list_spaces', {});
```

## Manual Installation

If you prefer to run the MCP server directly:

```bash
# Clone the repository
git clone https://github.com/primrose-ai/primrose-mcp-confluence.git
cd primrose-mcp-confluence

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## Configuration

### Required Headers

| Header | Description |
|--------|-------------|
| `X-Confluence-Domain` | Your Atlassian domain (e.g., "your-company" for your-company.atlassian.net) |
| `X-Confluence-Email` | Email address for Basic Auth |
| `X-Confluence-API-Token` | API token from id.atlassian.com |

### Optional Headers

| Header | Description |
|--------|-------------|
| `X-Confluence-Cloud-ID` | Direct cloud ID (alternative to domain) |

### Getting Your API Token

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a descriptive name
4. Copy the token and use it as your `X-Confluence-API-Token`

## Available Tools

### Space Tools
- `confluence_list_spaces` - List all spaces
- `confluence_get_space` - Get space details
- `confluence_create_space` - Create a new space
- `confluence_delete_space` - Delete a space

### Page Tools
- `confluence_list_pages` - List pages in a space
- `confluence_get_page` - Get page content
- `confluence_create_page` - Create a new page
- `confluence_update_page` - Update page content
- `confluence_delete_page` - Delete a page
- `confluence_get_page_versions` - Get page version history

### Blog Post Tools
- `confluence_list_blogposts` - List blog posts
- `confluence_get_blogpost` - Get blog post content
- `confluence_create_blogpost` - Create a blog post
- `confluence_update_blogpost` - Update a blog post

### Comment Tools
- `confluence_list_comments` - List comments on a page
- `confluence_create_comment` - Add a comment
- `confluence_delete_comment` - Remove a comment

### Attachment Tools
- `confluence_list_attachments` - List page attachments
- `confluence_get_attachment` - Get attachment details
- `confluence_upload_attachment` - Upload a file

### Label Tools
- `confluence_list_labels` - List labels on content
- `confluence_add_label` - Add a label
- `confluence_remove_label` - Remove a label

### Task Tools
- `confluence_list_tasks` - List inline tasks
- `confluence_update_task` - Update task status

### User Tools
- `confluence_get_current_user` - Get current user info
- `confluence_get_user` - Get user by ID

### Content Tools
- `confluence_get_content_properties` - Get content properties
- `confluence_set_content_property` - Set a content property

### Search Tools
- `confluence_search` - Search Confluence content using CQL

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run typecheck
```

## Related Resources

- [Primrose SDK Documentation](https://primrose.dev/docs)
- [Confluence REST API Documentation](https://developer.atlassian.com/cloud/confluence/rest/v2/intro/)
- [Model Context Protocol](https://modelcontextprotocol.io)
