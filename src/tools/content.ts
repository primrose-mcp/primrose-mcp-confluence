/**
 * Content Tools
 *
 * MCP tools for Confluence custom content, databases, folders, and whiteboards.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ConfluenceClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

const bodyFormatSchema = z.enum(['storage', 'atlas_doc_format', 'view', 'editor']).optional();
const bodyRepresentationSchema = z.enum(['storage', 'atlas_doc_format', 'wiki']);

/**
 * Register all content-related tools (custom content, databases, folders, whiteboards)
 */
export function registerContentTools(server: McpServer, client: ConfluenceClient): void {
  // ===========================================================================
  // Custom Content
  // ===========================================================================

  server.tool(
    'confluence_list_custom_content',
    `List Confluence custom content.

Args:
  - type: Filter by custom content type
  - spaceId: Filter by space ID
  - limit: Number of items to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of custom content items.`,
    {
      type: z.string().optional().describe('Filter by custom content type'),
      spaceId: z.string().optional().describe('Filter by space ID'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ type, spaceId, limit, cursor }) => {
      try {
        const result = await client.listCustomContent({ type, spaceId, limit, cursor });
        return formatResponse(result, 'json', 'customContent');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'confluence_get_custom_content',
    `Get a specific Confluence custom content by ID.

Args:
  - customContentId: The custom content ID
  - bodyFormat: Body format to return

Returns:
  Custom content details.`,
    {
      customContentId: z.string().describe('Custom content ID'),
      bodyFormat: bodyFormatSchema,
    },
    async ({ customContentId, bodyFormat }) => {
      try {
        const customContent = await client.getCustomContent(customContentId, bodyFormat);
        return formatResponse(customContent, 'json', 'customContent');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'confluence_create_custom_content',
    `Create a new Confluence custom content.

Args:
  - type: Custom content type
  - spaceId: Space ID (optional, depends on content type)
  - pageId: Page ID to attach to (optional)
  - blogPostId: Blog post ID to attach to (optional)
  - title: Content title (optional)
  - body: Content body
  - bodyRepresentation: Body format
  - status: Content status

Returns:
  The created custom content record.`,
    {
      type: z.string().describe('Custom content type'),
      spaceId: z.string().optional().describe('Space ID'),
      pageId: z.string().optional().describe('Page ID'),
      blogPostId: z.string().optional().describe('Blog post ID'),
      title: z.string().optional().describe('Content title'),
      body: z.string().optional().describe('Content body'),
      bodyRepresentation: bodyRepresentationSchema.optional(),
      status: z.enum(['current', 'draft']).default('current'),
    },
    async ({ type, spaceId, pageId, blogPostId, title, body, bodyRepresentation, status }) => {
      try {
        const customContent = await client.createCustomContent({
          type,
          spaceId,
          pageId,
          blogPostId,
          title,
          body: body && bodyRepresentation ? { representation: bodyRepresentation, value: body } : undefined,
          status,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Custom content created', customContent }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'confluence_update_custom_content',
    `Update an existing Confluence custom content.

Args:
  - customContentId: Custom content ID to update
  - title: New title (optional)
  - body: New body content (optional)
  - bodyRepresentation: Body format
  - version: Current version number
  - status: Content status

Returns:
  The updated custom content record.`,
    {
      customContentId: z.string().describe('Custom content ID'),
      title: z.string().optional().describe('New title'),
      body: z.string().optional().describe('New body content'),
      bodyRepresentation: bodyRepresentationSchema.optional(),
      version: z.number().int().describe('Current version number'),
      status: z.enum(['current', 'draft']).optional(),
    },
    async ({ customContentId, title, body, bodyRepresentation, version, status }) => {
      try {
        const customContent = await client.updateCustomContent(customContentId, {
          id: customContentId,
          title,
          body: body && bodyRepresentation ? { representation: bodyRepresentation, value: body } : undefined,
          version: { number: version + 1 },
          status,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Custom content updated', customContent }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'confluence_delete_custom_content',
    `Delete a Confluence custom content.

Args:
  - customContentId: Custom content ID to delete
  - purge: If true, permanently delete

Returns:
  Confirmation of deletion.`,
    {
      customContentId: z.string().describe('Custom content ID'),
      purge: z.boolean().default(false),
    },
    async ({ customContentId, purge }) => {
      try {
        await client.deleteCustomContent(customContentId, purge);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Custom content deleted' }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Databases
  // ===========================================================================

  server.tool(
    'confluence_list_databases',
    `List Confluence databases.

Args:
  - spaceId: Filter by space ID
  - limit: Number of databases to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of databases.`,
    {
      spaceId: z.string().optional().describe('Filter by space ID'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ spaceId, limit, cursor }) => {
      try {
        const result = await client.listDatabases({ spaceId, limit, cursor });
        return formatResponse(result, 'json', 'databases');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'confluence_get_database',
    `Get a specific Confluence database by ID.

Args:
  - databaseId: The database ID

Returns:
  Database details.`,
    {
      databaseId: z.string().describe('Database ID'),
    },
    async ({ databaseId }) => {
      try {
        const database = await client.getDatabase(databaseId);
        return formatResponse(database, 'json', 'database');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Folders
  // ===========================================================================

  server.tool(
    'confluence_list_folders',
    `List Confluence folders.

Args:
  - spaceId: Filter by space ID
  - limit: Number of folders to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of folders.`,
    {
      spaceId: z.string().optional().describe('Filter by space ID'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ spaceId, limit, cursor }) => {
      try {
        const result = await client.listFolders({ spaceId, limit, cursor });
        return formatResponse(result, 'json', 'folders');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'confluence_get_folder',
    `Get a specific Confluence folder by ID.

Args:
  - folderId: The folder ID

Returns:
  Folder details.`,
    {
      folderId: z.string().describe('Folder ID'),
    },
    async ({ folderId }) => {
      try {
        const folder = await client.getFolder(folderId);
        return formatResponse(folder, 'json', 'folder');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Whiteboards
  // ===========================================================================

  server.tool(
    'confluence_list_whiteboards',
    `List Confluence whiteboards.

Args:
  - spaceId: Filter by space ID
  - limit: Number of whiteboards to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of whiteboards.`,
    {
      spaceId: z.string().optional().describe('Filter by space ID'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ spaceId, limit, cursor }) => {
      try {
        const result = await client.listWhiteboards({ spaceId, limit, cursor });
        return formatResponse(result, 'json', 'whiteboards');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'confluence_get_whiteboard',
    `Get a specific Confluence whiteboard by ID.

Args:
  - whiteboardId: The whiteboard ID

Returns:
  Whiteboard details.`,
    {
      whiteboardId: z.string().describe('Whiteboard ID'),
    },
    async ({ whiteboardId }) => {
      try {
        const whiteboard = await client.getWhiteboard(whiteboardId);
        return formatResponse(whiteboard, 'json', 'whiteboard');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
