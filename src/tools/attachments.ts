/**
 * Attachment Tools
 *
 * MCP tools for Confluence attachment management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ConfluenceClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all attachment-related tools
 */
export function registerAttachmentTools(server: McpServer, client: ConfluenceClient): void {
  // ===========================================================================
  // List Attachments
  // ===========================================================================
  server.tool(
    'confluence_list_attachments',
    `List all Confluence attachments with filtering and pagination.

Args:
  - status: Filter by status ('current', 'trashed', 'archived')
  - mediaType: Filter by MIME type (e.g., 'image/png', 'application/pdf')
  - filename: Filter by filename
  - limit: Number of attachments to return (1-250, default: 25)
  - cursor: Pagination cursor
  - format: Response format

Returns:
  List of attachments with ID, title, media type, and file size.`,
    {
      status: z.enum(['current', 'trashed', 'archived']).optional().describe('Filter by status'),
      mediaType: z.string().optional().describe('Filter by MIME type'),
      filename: z.string().optional().describe('Filter by filename'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ status, mediaType, filename, limit, cursor, format }) => {
      try {
        const result = await client.listAttachments({ status, mediaType, filename, limit, cursor });
        return formatResponse(result, format, 'attachments');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Attachment
  // ===========================================================================
  server.tool(
    'confluence_get_attachment',
    `Get a specific Confluence attachment by ID.

Args:
  - attachmentId: The attachment ID
  - format: Response format

Returns:
  Attachment details including ID, title, media type, file size, and download link.`,
    {
      attachmentId: z.string().describe('Attachment ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ attachmentId, format }) => {
      try {
        const attachment = await client.getAttachment(attachmentId);
        return formatResponse(attachment, format, 'attachment');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Attachment
  // ===========================================================================
  server.tool(
    'confluence_delete_attachment',
    `Delete a Confluence attachment.

Args:
  - attachmentId: Attachment ID to delete
  - purge: If true, permanently delete instead of moving to trash

Returns:
  Confirmation of deletion.`,
    {
      attachmentId: z.string().describe('Attachment ID'),
      purge: z.boolean().default(false).describe('Permanently delete'),
    },
    async ({ attachmentId, purge }) => {
      try {
        await client.deleteAttachment(attachmentId, purge);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: purge ? `Attachment ${attachmentId} permanently deleted` : `Attachment ${attachmentId} moved to trash`,
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
  // Get Attachment Labels
  // ===========================================================================
  server.tool(
    'confluence_get_attachment_labels',
    `Get labels for a Confluence attachment.

Args:
  - attachmentId: Attachment ID
  - limit: Number of labels to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of labels on the attachment.`,
    {
      attachmentId: z.string().describe('Attachment ID'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ attachmentId, limit, cursor }) => {
      try {
        const result = await client.getAttachmentLabels(attachmentId, { limit, cursor });
        return formatResponse(result, 'json', 'labels');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
