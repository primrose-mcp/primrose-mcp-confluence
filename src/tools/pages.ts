/**
 * Page Tools
 *
 * MCP tools for Confluence page management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ConfluenceClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

const bodyFormatSchema = z.enum(['storage', 'atlas_doc_format', 'view', 'editor']).optional();
const bodyRepresentationSchema = z.enum(['storage', 'atlas_doc_format', 'wiki']);

/**
 * Register all page-related tools
 */
export function registerPageTools(server: McpServer, client: ConfluenceClient): void {
  // ===========================================================================
  // List Pages
  // ===========================================================================
  server.tool(
    'confluence_list_pages',
    `List Confluence pages with filtering and pagination.

Args:
  - spaceId: Filter by space ID
  - status: Filter by status ('current', 'trashed', 'draft', 'archived')
  - title: Filter by title (exact match)
  - bodyFormat: Body format to return ('storage', 'atlas_doc_format', 'view', 'editor')
  - limit: Number of pages to return (1-250, default: 25)
  - cursor: Pagination cursor
  - format: Response format ('json' or 'markdown')

Returns:
  List of pages with ID, title, space, status, and version.`,
    {
      spaceId: z.string().optional().describe('Filter by space ID'),
      status: z.enum(['current', 'trashed', 'draft', 'archived']).optional().describe('Filter by status'),
      title: z.string().optional().describe('Filter by title'),
      bodyFormat: bodyFormatSchema.describe('Body format to return'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ spaceId, status, title, bodyFormat, limit, cursor, format }) => {
      try {
        const result = await client.listPages({ spaceId, status, title, bodyFormat, limit, cursor });
        return formatResponse(result, format, 'pages');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Pages in Space
  // ===========================================================================
  server.tool(
    'confluence_get_pages_in_space',
    `Get all pages in a specific Confluence space.

Args:
  - spaceId: The space ID
  - status: Filter by status
  - bodyFormat: Body format to return
  - limit: Number of pages to return (1-250, default: 25)
  - cursor: Pagination cursor
  - format: Response format

Returns:
  List of pages in the specified space.`,
    {
      spaceId: z.string().describe('Space ID'),
      status: z.enum(['current', 'trashed', 'draft', 'archived']).optional(),
      bodyFormat: bodyFormatSchema,
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ spaceId, status, bodyFormat, limit, cursor, format }) => {
      try {
        const result = await client.getPagesBySpaceId(spaceId, { status, bodyFormat, limit, cursor });
        return formatResponse(result, format, 'pages');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Page
  // ===========================================================================
  server.tool(
    'confluence_get_page',
    `Get a specific Confluence page by ID.

Args:
  - pageId: The page ID
  - bodyFormat: Body format to return ('storage', 'atlas_doc_format', 'view', 'editor')
  - format: Response format

Returns:
  Page details including ID, title, body content, version, and links.`,
    {
      pageId: z.string().describe('Page ID'),
      bodyFormat: bodyFormatSchema.describe('Body format to return'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ pageId, bodyFormat, format }) => {
      try {
        const page = await client.getPage(pageId, bodyFormat);
        return formatResponse(page, format, 'page');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Page
  // ===========================================================================
  server.tool(
    'confluence_create_page',
    `Create a new Confluence page.

Args:
  - spaceId: Space ID where the page will be created
  - title: Page title
  - body: Page body content
  - bodyRepresentation: Body format ('storage', 'atlas_doc_format', 'wiki')
  - parentId: Parent page ID (optional, for nested pages)
  - status: Page status ('current' for published, 'draft' for draft)

Returns:
  The created page record.`,
    {
      spaceId: z.string().describe('Space ID'),
      title: z.string().min(1).describe('Page title'),
      body: z.string().describe('Page body content'),
      bodyRepresentation: bodyRepresentationSchema.default('storage').describe('Body format'),
      parentId: z.string().optional().describe('Parent page ID'),
      status: z.enum(['current', 'draft']).default('current').describe('Page status'),
    },
    async ({ spaceId, title, body, bodyRepresentation, parentId, status }) => {
      try {
        const page = await client.createPage({
          spaceId,
          title,
          body: { representation: bodyRepresentation, value: body },
          parentId,
          status,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Page created', page }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Page
  // ===========================================================================
  server.tool(
    'confluence_update_page',
    `Update an existing Confluence page.

Args:
  - pageId: Page ID to update
  - title: New page title
  - body: New page body content
  - bodyRepresentation: Body format ('storage', 'atlas_doc_format', 'wiki')
  - version: Current version number (required for optimistic locking)
  - versionMessage: Optional message describing the change
  - status: Page status

Returns:
  The updated page record.`,
    {
      pageId: z.string().describe('Page ID'),
      title: z.string().min(1).describe('Page title'),
      body: z.string().describe('Page body content'),
      bodyRepresentation: bodyRepresentationSchema.default('storage'),
      version: z.number().int().describe('Current version number'),
      versionMessage: z.string().optional().describe('Version change message'),
      status: z.enum(['current', 'draft']).optional(),
    },
    async ({ pageId, title, body, bodyRepresentation, version, versionMessage, status }) => {
      try {
        const page = await client.updatePage(pageId, {
          id: pageId,
          title,
          body: { representation: bodyRepresentation, value: body },
          version: { number: version + 1, message: versionMessage },
          status,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Page updated', page }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Page
  // ===========================================================================
  server.tool(
    'confluence_delete_page',
    `Delete a Confluence page.

Args:
  - pageId: Page ID to delete
  - purge: If true, permanently delete instead of moving to trash

Returns:
  Confirmation of deletion.`,
    {
      pageId: z.string().describe('Page ID'),
      purge: z.boolean().default(false).describe('Permanently delete'),
    },
    async ({ pageId, purge }) => {
      try {
        await client.deletePage(pageId, purge);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: purge ? `Page ${pageId} permanently deleted` : `Page ${pageId} moved to trash`,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Page Children
  // ===========================================================================
  server.tool(
    'confluence_get_page_children',
    `Get child pages of a Confluence page.

Args:
  - pageId: Parent page ID
  - limit: Number of children to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of child pages/content.`,
    {
      pageId: z.string().describe('Parent page ID'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ pageId, limit, cursor }) => {
      try {
        const result = await client.getPageChildren(pageId, { limit, cursor });
        return formatResponse(result, 'json', 'children');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Page Ancestors
  // ===========================================================================
  server.tool(
    'confluence_get_page_ancestors',
    `Get ancestor pages of a Confluence page (hierarchy path from root).

Args:
  - pageId: Page ID

Returns:
  List of ancestor pages from root to parent.`,
    {
      pageId: z.string().describe('Page ID'),
    },
    async ({ pageId }) => {
      try {
        const ancestors = await client.getPageAncestors(pageId);
        return formatResponse(ancestors, 'json', 'ancestors');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Page Descendants
  // ===========================================================================
  server.tool(
    'confluence_get_page_descendants',
    `Get all descendant pages of a Confluence page (recursive children).

Args:
  - pageId: Page ID
  - limit: Number of descendants to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of all descendant pages.`,
    {
      pageId: z.string().describe('Page ID'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ pageId, limit, cursor }) => {
      try {
        const result = await client.getPageDescendants(pageId, { limit, cursor });
        return formatResponse(result, 'json', 'descendants');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Page Versions
  // ===========================================================================
  server.tool(
    'confluence_get_page_versions',
    `Get version history for a Confluence page.

Args:
  - pageId: Page ID
  - limit: Number of versions to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of page versions with number, author, and timestamp.`,
    {
      pageId: z.string().describe('Page ID'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ pageId, limit, cursor }) => {
      try {
        const result = await client.getPageVersions(pageId, { limit, cursor });
        return formatResponse(result, 'json', 'versions');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Page Version
  // ===========================================================================
  server.tool(
    'confluence_get_page_version',
    `Get a specific version of a Confluence page.

Args:
  - pageId: Page ID
  - versionNumber: Version number to retrieve

Returns:
  Version details.`,
    {
      pageId: z.string().describe('Page ID'),
      versionNumber: z.number().int().describe('Version number'),
    },
    async ({ pageId, versionNumber }) => {
      try {
        const version = await client.getPageVersion(pageId, versionNumber);
        return formatResponse(version, 'json', 'version');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Page Properties
  // ===========================================================================
  server.tool(
    'confluence_get_page_properties',
    `Get properties for a Confluence page.

Args:
  - pageId: Page ID
  - limit: Number of properties to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of page properties with key-value pairs.`,
    {
      pageId: z.string().describe('Page ID'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ pageId, limit, cursor }) => {
      try {
        const result = await client.getPageProperties(pageId, { limit, cursor });
        return formatResponse(result, 'json', 'properties');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Page Property
  // ===========================================================================
  server.tool(
    'confluence_create_page_property',
    `Create a property for a Confluence page.

Args:
  - pageId: Page ID
  - key: Property key
  - value: Property value (any JSON value)

Returns:
  The created property.`,
    {
      pageId: z.string().describe('Page ID'),
      key: z.string().describe('Property key'),
      value: z.any().describe('Property value (JSON)'),
    },
    async ({ pageId, key, value }) => {
      try {
        const property = await client.createPageProperty(pageId, { key, value });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Property created', property }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Page Property
  // ===========================================================================
  server.tool(
    'confluence_update_page_property',
    `Update a property for a Confluence page.

Args:
  - pageId: Page ID
  - propertyKey: Property key
  - value: New property value
  - version: Current version number

Returns:
  The updated property.`,
    {
      pageId: z.string().describe('Page ID'),
      propertyKey: z.string().describe('Property key'),
      value: z.any().describe('New property value (JSON)'),
      version: z.number().int().describe('Current version number'),
    },
    async ({ pageId, propertyKey, value, version }) => {
      try {
        const property = await client.updatePageProperty(pageId, propertyKey, {
          key: propertyKey,
          value,
          version: { number: version },
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Property updated', property }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Page Property
  // ===========================================================================
  server.tool(
    'confluence_delete_page_property',
    `Delete a property from a Confluence page.

Args:
  - pageId: Page ID
  - propertyKey: Property key to delete

Returns:
  Confirmation of deletion.`,
    {
      pageId: z.string().describe('Page ID'),
      propertyKey: z.string().describe('Property key'),
    },
    async ({ pageId, propertyKey }) => {
      try {
        await client.deletePageProperty(pageId, propertyKey);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Property deleted' }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Page Attachments
  // ===========================================================================
  server.tool(
    'confluence_get_page_attachments',
    `Get attachments for a Confluence page.

Args:
  - pageId: Page ID
  - limit: Number of attachments to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of attachments with file details.`,
    {
      pageId: z.string().describe('Page ID'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ pageId, limit, cursor }) => {
      try {
        const result = await client.getPageAttachments(pageId, { limit, cursor });
        return formatResponse(result, 'json', 'attachments');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Page Comments
  // ===========================================================================
  server.tool(
    'confluence_get_page_comments',
    `Get comments on a Confluence page.

Args:
  - pageId: Page ID
  - bodyFormat: Body format to return
  - limit: Number of comments to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of comments on the page.`,
    {
      pageId: z.string().describe('Page ID'),
      bodyFormat: bodyFormatSchema,
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ pageId, bodyFormat, limit, cursor }) => {
      try {
        const result = await client.getPageComments(pageId, { bodyFormat, limit, cursor });
        return formatResponse(result, 'json', 'comments');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Page Operations
  // ===========================================================================
  server.tool(
    'confluence_get_page_operations',
    `Get permitted operations for a Confluence page.

Args:
  - pageId: Page ID

Returns:
  List of operations the current user can perform.`,
    {
      pageId: z.string().describe('Page ID'),
    },
    async ({ pageId }) => {
      try {
        const operations = await client.getPageOperations(pageId);
        return formatResponse(operations, 'json', 'operations');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Page Labels
  // ===========================================================================
  server.tool(
    'confluence_get_page_labels',
    `Get labels for a Confluence page.

Args:
  - pageId: Page ID
  - prefix: Filter by label prefix ('global', 'my', 'team', 'system')
  - limit: Number of labels to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of labels on the page.`,
    {
      pageId: z.string().describe('Page ID'),
      prefix: z.enum(['global', 'my', 'team', 'system']).optional().describe('Filter by prefix'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ pageId, prefix, limit, cursor }) => {
      try {
        const result = await client.getPageLabels(pageId, { prefix, limit, cursor });
        return formatResponse(result, 'json', 'labels');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Add Page Labels
  // ===========================================================================
  server.tool(
    'confluence_add_page_labels',
    `Add labels to a Confluence page.

Args:
  - pageId: Page ID
  - labels: Array of label names to add
  - prefix: Label prefix ('global', 'my', 'team', default: 'global')

Returns:
  The added labels.`,
    {
      pageId: z.string().describe('Page ID'),
      labels: z.array(z.string()).min(1).describe('Label names to add'),
      prefix: z.enum(['global', 'my', 'team']).default('global').describe('Label prefix'),
    },
    async ({ pageId, labels: labelNames, prefix }) => {
      try {
        const labelInputs = labelNames.map(name => ({ name, prefix }));
        const labels = await client.addPageLabels(pageId, labelInputs);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Labels added', labels }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Remove Page Label
  // ===========================================================================
  server.tool(
    'confluence_remove_page_label',
    `Remove a label from a Confluence page.

Args:
  - pageId: Page ID
  - labelId: Label ID to remove

Returns:
  Confirmation of removal.`,
    {
      pageId: z.string().describe('Page ID'),
      labelId: z.string().describe('Label ID to remove'),
    },
    async ({ pageId, labelId }) => {
      try {
        await client.removePageLabel(pageId, labelId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Label removed' }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Page Likes
  // ===========================================================================
  server.tool(
    'confluence_get_page_likes',
    `Get users who liked a Confluence page.

Args:
  - pageId: Page ID
  - limit: Number of likes to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of users who liked the page.`,
    {
      pageId: z.string().describe('Page ID'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ pageId, limit, cursor }) => {
      try {
        const result = await client.getPageLikes(pageId, { limit, cursor });
        return formatResponse(result, 'json', 'likes');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Like Page
  // ===========================================================================
  server.tool(
    'confluence_like_page',
    `Like a Confluence page.

Args:
  - pageId: Page ID to like

Returns:
  Confirmation of the like.`,
    {
      pageId: z.string().describe('Page ID'),
    },
    async ({ pageId }) => {
      try {
        await client.likePage(pageId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Page liked' }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Unlike Page
  // ===========================================================================
  server.tool(
    'confluence_unlike_page',
    `Remove like from a Confluence page.

Args:
  - pageId: Page ID to unlike

Returns:
  Confirmation of the unlike.`,
    {
      pageId: z.string().describe('Page ID'),
    },
    async ({ pageId }) => {
      try {
        await client.unlikePage(pageId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Page unliked' }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
