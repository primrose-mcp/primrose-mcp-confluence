/**
 * Comment Tools
 *
 * MCP tools for Confluence comment management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ConfluenceClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

const bodyFormatSchema = z.enum(['storage', 'atlas_doc_format', 'view', 'editor']).optional();
const bodyRepresentationSchema = z.enum(['storage', 'atlas_doc_format', 'wiki']);

/**
 * Register all comment-related tools
 */
export function registerCommentTools(server: McpServer, client: ConfluenceClient): void {
  // ===========================================================================
  // List Comments
  // ===========================================================================
  server.tool(
    'confluence_list_comments',
    `List all Confluence comments across the instance.

Args:
  - bodyFormat: Body format to return
  - limit: Number of comments to return (1-250, default: 25)
  - cursor: Pagination cursor
  - format: Response format

Returns:
  List of comments.`,
    {
      bodyFormat: bodyFormatSchema,
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ bodyFormat, limit, cursor, format }) => {
      try {
        const result = await client.listComments({ bodyFormat, limit, cursor });
        return formatResponse(result, format, 'comments');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Comment
  // ===========================================================================
  server.tool(
    'confluence_get_comment',
    `Get a specific Confluence comment by ID.

Args:
  - commentId: The comment ID
  - bodyFormat: Body format to return
  - format: Response format

Returns:
  Comment details including ID, body content, version, and links.`,
    {
      commentId: z.string().describe('Comment ID'),
      bodyFormat: bodyFormatSchema,
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ commentId, bodyFormat, format }) => {
      try {
        const comment = await client.getComment(commentId, bodyFormat);
        return formatResponse(comment, format, 'comment');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Comment
  // ===========================================================================
  server.tool(
    'confluence_create_comment',
    `Create a new Confluence comment.

Args:
  - pageId: Page ID to comment on (mutually exclusive with blogPostId)
  - blogPostId: Blog post ID to comment on (mutually exclusive with pageId)
  - parentCommentId: Parent comment ID for replies
  - body: Comment body content
  - bodyRepresentation: Body format ('storage', 'atlas_doc_format', 'wiki')

Returns:
  The created comment record.`,
    {
      pageId: z.string().optional().describe('Page ID to comment on'),
      blogPostId: z.string().optional().describe('Blog post ID to comment on'),
      parentCommentId: z.string().optional().describe('Parent comment ID for replies'),
      body: z.string().describe('Comment body content'),
      bodyRepresentation: bodyRepresentationSchema.default('storage'),
    },
    async ({ pageId, blogPostId, parentCommentId, body, bodyRepresentation }) => {
      try {
        if (!pageId && !blogPostId) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: 'Either pageId or blogPostId is required' }, null, 2) }],
            isError: true,
          };
        }
        const comment = await client.createComment({
          pageId,
          blogPostId,
          parentCommentId,
          body: { representation: bodyRepresentation, value: body },
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Comment created', comment }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Comment
  // ===========================================================================
  server.tool(
    'confluence_update_comment',
    `Update an existing Confluence comment.

Args:
  - commentId: Comment ID to update
  - body: New comment body content
  - bodyRepresentation: Body format ('storage', 'atlas_doc_format', 'wiki')
  - version: Current version number (required for optimistic locking)
  - versionMessage: Optional message describing the change

Returns:
  The updated comment record.`,
    {
      commentId: z.string().describe('Comment ID'),
      body: z.string().describe('Comment body content'),
      bodyRepresentation: bodyRepresentationSchema.default('storage'),
      version: z.number().int().describe('Current version number'),
      versionMessage: z.string().optional(),
    },
    async ({ commentId, body, bodyRepresentation, version, versionMessage }) => {
      try {
        const comment = await client.updateComment(commentId, {
          body: { representation: bodyRepresentation, value: body },
          version: { number: version + 1, message: versionMessage },
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Comment updated', comment }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Comment
  // ===========================================================================
  server.tool(
    'confluence_delete_comment',
    `Delete a Confluence comment.

Args:
  - commentId: Comment ID to delete

Returns:
  Confirmation of deletion.`,
    {
      commentId: z.string().describe('Comment ID'),
    },
    async ({ commentId }) => {
      try {
        await client.deleteComment(commentId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: `Comment ${commentId} deleted` }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
