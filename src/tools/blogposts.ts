/**
 * Blog Post Tools
 *
 * MCP tools for Confluence blog post management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ConfluenceClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

const bodyFormatSchema = z.enum(['storage', 'atlas_doc_format', 'view', 'editor']).optional();
const bodyRepresentationSchema = z.enum(['storage', 'atlas_doc_format', 'wiki']);

/**
 * Register all blog post-related tools
 */
export function registerBlogPostTools(server: McpServer, client: ConfluenceClient): void {
  // ===========================================================================
  // List Blog Posts
  // ===========================================================================
  server.tool(
    'confluence_list_blogposts',
    `List Confluence blog posts with filtering and pagination.

Args:
  - spaceId: Filter by space ID
  - status: Filter by status ('current', 'trashed', 'draft', 'archived')
  - title: Filter by title (exact match)
  - bodyFormat: Body format to return
  - limit: Number of posts to return (1-250, default: 25)
  - cursor: Pagination cursor
  - format: Response format

Returns:
  List of blog posts with ID, title, space, status, and created date.`,
    {
      spaceId: z.string().optional().describe('Filter by space ID'),
      status: z.enum(['current', 'trashed', 'draft', 'archived']).optional(),
      title: z.string().optional().describe('Filter by title'),
      bodyFormat: bodyFormatSchema,
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ spaceId, status, title, bodyFormat, limit, cursor, format }) => {
      try {
        const result = await client.listBlogPosts({ spaceId, status, title, bodyFormat, limit, cursor });
        return formatResponse(result, format, 'blogposts');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Blog Posts in Space
  // ===========================================================================
  server.tool(
    'confluence_get_blogposts_in_space',
    `Get all blog posts in a specific Confluence space.

Args:
  - spaceId: The space ID
  - status: Filter by status
  - bodyFormat: Body format to return
  - limit: Number of posts to return (1-250, default: 25)
  - cursor: Pagination cursor
  - format: Response format

Returns:
  List of blog posts in the specified space.`,
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
        const result = await client.getBlogPostsBySpaceId(spaceId, { status, bodyFormat, limit, cursor });
        return formatResponse(result, format, 'blogposts');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Blog Post
  // ===========================================================================
  server.tool(
    'confluence_get_blogpost',
    `Get a specific Confluence blog post by ID.

Args:
  - blogPostId: The blog post ID
  - bodyFormat: Body format to return
  - format: Response format

Returns:
  Blog post details including ID, title, body content, version, and links.`,
    {
      blogPostId: z.string().describe('Blog post ID'),
      bodyFormat: bodyFormatSchema,
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ blogPostId, bodyFormat, format }) => {
      try {
        const blogPost = await client.getBlogPost(blogPostId, bodyFormat);
        return formatResponse(blogPost, format, 'blogpost');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Blog Post
  // ===========================================================================
  server.tool(
    'confluence_create_blogpost',
    `Create a new Confluence blog post.

Args:
  - spaceId: Space ID where the blog post will be created
  - title: Blog post title
  - body: Blog post body content
  - bodyRepresentation: Body format ('storage', 'atlas_doc_format', 'wiki')
  - status: Post status ('current' for published, 'draft' for draft)

Returns:
  The created blog post record.`,
    {
      spaceId: z.string().describe('Space ID'),
      title: z.string().min(1).describe('Blog post title'),
      body: z.string().describe('Blog post body content'),
      bodyRepresentation: bodyRepresentationSchema.default('storage'),
      status: z.enum(['current', 'draft']).default('current'),
    },
    async ({ spaceId, title, body, bodyRepresentation, status }) => {
      try {
        const blogPost = await client.createBlogPost({
          spaceId,
          title,
          body: { representation: bodyRepresentation, value: body },
          status,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Blog post created', blogPost }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Blog Post
  // ===========================================================================
  server.tool(
    'confluence_update_blogpost',
    `Update an existing Confluence blog post.

Args:
  - blogPostId: Blog post ID to update
  - title: New blog post title
  - body: New blog post body content
  - bodyRepresentation: Body format ('storage', 'atlas_doc_format', 'wiki')
  - version: Current version number (required for optimistic locking)
  - versionMessage: Optional message describing the change
  - status: Post status

Returns:
  The updated blog post record.`,
    {
      blogPostId: z.string().describe('Blog post ID'),
      title: z.string().min(1).describe('Blog post title'),
      body: z.string().describe('Blog post body content'),
      bodyRepresentation: bodyRepresentationSchema.default('storage'),
      version: z.number().int().describe('Current version number'),
      versionMessage: z.string().optional(),
      status: z.enum(['current', 'draft']).optional(),
    },
    async ({ blogPostId, title, body, bodyRepresentation, version, versionMessage, status }) => {
      try {
        const blogPost = await client.updateBlogPost(blogPostId, {
          id: blogPostId,
          title,
          body: { representation: bodyRepresentation, value: body },
          version: { number: version + 1, message: versionMessage },
          status,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Blog post updated', blogPost }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Blog Post
  // ===========================================================================
  server.tool(
    'confluence_delete_blogpost',
    `Delete a Confluence blog post.

Args:
  - blogPostId: Blog post ID to delete
  - purge: If true, permanently delete instead of moving to trash

Returns:
  Confirmation of deletion.`,
    {
      blogPostId: z.string().describe('Blog post ID'),
      purge: z.boolean().default(false).describe('Permanently delete'),
    },
    async ({ blogPostId, purge }) => {
      try {
        await client.deleteBlogPost(blogPostId, purge);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: purge ? `Blog post ${blogPostId} permanently deleted` : `Blog post ${blogPostId} moved to trash`,
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
  // Get Blog Post Versions
  // ===========================================================================
  server.tool(
    'confluence_get_blogpost_versions',
    `Get version history for a Confluence blog post.

Args:
  - blogPostId: Blog post ID
  - limit: Number of versions to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of blog post versions.`,
    {
      blogPostId: z.string().describe('Blog post ID'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ blogPostId, limit, cursor }) => {
      try {
        const result = await client.getBlogPostVersions(blogPostId, { limit, cursor });
        return formatResponse(result, 'json', 'versions');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Blog Post Attachments
  // ===========================================================================
  server.tool(
    'confluence_get_blogpost_attachments',
    `Get attachments for a Confluence blog post.

Args:
  - blogPostId: Blog post ID
  - limit: Number of attachments to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of attachments.`,
    {
      blogPostId: z.string().describe('Blog post ID'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ blogPostId, limit, cursor }) => {
      try {
        const result = await client.getBlogPostAttachments(blogPostId, { limit, cursor });
        return formatResponse(result, 'json', 'attachments');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Blog Post Comments
  // ===========================================================================
  server.tool(
    'confluence_get_blogpost_comments',
    `Get comments on a Confluence blog post.

Args:
  - blogPostId: Blog post ID
  - bodyFormat: Body format to return
  - limit: Number of comments to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of comments on the blog post.`,
    {
      blogPostId: z.string().describe('Blog post ID'),
      bodyFormat: bodyFormatSchema,
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ blogPostId, bodyFormat, limit, cursor }) => {
      try {
        const result = await client.getBlogPostComments(blogPostId, { bodyFormat, limit, cursor });
        return formatResponse(result, 'json', 'comments');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Blog Post Labels
  // ===========================================================================
  server.tool(
    'confluence_get_blogpost_labels',
    `Get labels for a Confluence blog post.

Args:
  - blogPostId: Blog post ID
  - prefix: Filter by label prefix
  - limit: Number of labels to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of labels on the blog post.`,
    {
      blogPostId: z.string().describe('Blog post ID'),
      prefix: z.enum(['global', 'my', 'team', 'system']).optional(),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ blogPostId, prefix, limit, cursor }) => {
      try {
        const result = await client.getBlogPostLabels(blogPostId, { prefix, limit, cursor });
        return formatResponse(result, 'json', 'labels');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Add Blog Post Labels
  // ===========================================================================
  server.tool(
    'confluence_add_blogpost_labels',
    `Add labels to a Confluence blog post.

Args:
  - blogPostId: Blog post ID
  - labels: Array of label names to add
  - prefix: Label prefix ('global', 'my', 'team', default: 'global')

Returns:
  The added labels.`,
    {
      blogPostId: z.string().describe('Blog post ID'),
      labels: z.array(z.string()).min(1).describe('Label names to add'),
      prefix: z.enum(['global', 'my', 'team']).default('global'),
    },
    async ({ blogPostId, labels: labelNames, prefix }) => {
      try {
        const labelInputs = labelNames.map(name => ({ name, prefix }));
        const labels = await client.addBlogPostLabels(blogPostId, labelInputs);
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
  // Remove Blog Post Label
  // ===========================================================================
  server.tool(
    'confluence_remove_blogpost_label',
    `Remove a label from a Confluence blog post.

Args:
  - blogPostId: Blog post ID
  - labelId: Label ID to remove

Returns:
  Confirmation of removal.`,
    {
      blogPostId: z.string().describe('Blog post ID'),
      labelId: z.string().describe('Label ID to remove'),
    },
    async ({ blogPostId, labelId }) => {
      try {
        await client.removeBlogPostLabel(blogPostId, labelId);
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
}
