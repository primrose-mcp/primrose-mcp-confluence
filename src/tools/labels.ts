/**
 * Label Tools
 *
 * MCP tools for Confluence label management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ConfluenceClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

const bodyFormatSchema = z.enum(['storage', 'atlas_doc_format', 'view', 'editor']).optional();

/**
 * Register all label-related tools
 */
export function registerLabelTools(server: McpServer, client: ConfluenceClient): void {
  // ===========================================================================
  // List Labels
  // ===========================================================================
  server.tool(
    'confluence_list_labels',
    `List all Confluence labels.

Args:
  - prefix: Filter by label prefix ('global', 'my', 'team', 'system')
  - limit: Number of labels to return (1-250, default: 25)
  - cursor: Pagination cursor
  - format: Response format

Returns:
  List of labels with ID, name, and prefix.`,
    {
      prefix: z.enum(['global', 'my', 'team', 'system']).optional().describe('Filter by prefix'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ prefix, limit, cursor, format }) => {
      try {
        const result = await client.listLabels({ prefix, limit, cursor });
        return formatResponse(result, format, 'labels');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Label
  // ===========================================================================
  server.tool(
    'confluence_get_label',
    `Get a specific Confluence label by ID.

Args:
  - labelId: The label ID
  - format: Response format

Returns:
  Label details including ID, name, and prefix.`,
    {
      labelId: z.string().describe('Label ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ labelId, format }) => {
      try {
        const label = await client.getLabel(labelId);
        return formatResponse(label, format, 'label');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Pages by Label
  // ===========================================================================
  server.tool(
    'confluence_get_label_pages',
    `Get all pages with a specific label.

Args:
  - labelId: The label ID
  - bodyFormat: Body format to return
  - limit: Number of pages to return (1-250, default: 25)
  - cursor: Pagination cursor
  - format: Response format

Returns:
  List of pages with the specified label.`,
    {
      labelId: z.string().describe('Label ID'),
      bodyFormat: bodyFormatSchema,
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ labelId, bodyFormat, limit, cursor, format }) => {
      try {
        const result = await client.getLabelPages(labelId, { bodyFormat, limit, cursor });
        return formatResponse(result, format, 'pages');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Blog Posts by Label
  // ===========================================================================
  server.tool(
    'confluence_get_label_blogposts',
    `Get all blog posts with a specific label.

Args:
  - labelId: The label ID
  - bodyFormat: Body format to return
  - limit: Number of blog posts to return (1-250, default: 25)
  - cursor: Pagination cursor
  - format: Response format

Returns:
  List of blog posts with the specified label.`,
    {
      labelId: z.string().describe('Label ID'),
      bodyFormat: bodyFormatSchema,
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ labelId, bodyFormat, limit, cursor, format }) => {
      try {
        const result = await client.getLabelBlogPosts(labelId, { bodyFormat, limit, cursor });
        return formatResponse(result, format, 'blogposts');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
