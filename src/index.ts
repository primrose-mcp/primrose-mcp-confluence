/**
 * Confluence MCP Server - Main Entry Point
 *
 * This file sets up the MCP server using Cloudflare's Agents SDK.
 * It supports stateless mode for multi-tenant deployments.
 *
 * MULTI-TENANT ARCHITECTURE:
 * Tenant credentials are parsed from request headers,
 * allowing a single server deployment to serve multiple customers.
 *
 * Required Headers:
 * - X-Confluence-Domain: Atlassian domain (e.g., "your-company" for your-company.atlassian.net)
 * - X-Confluence-Email: User email for Basic Auth
 * - X-Confluence-API-Token: API token from id.atlassian.com
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpAgent } from 'agents/mcp';
import { createConfluenceClient } from './client.js';
import {
  registerAttachmentTools,
  registerBlogPostTools,
  registerCommentTools,
  registerContentTools,
  registerLabelTools,
  registerPageTools,
  registerSearchTools,
  registerSpaceTools,
  registerTaskTools,
  registerUserTools,
} from './tools/index.js';
import {
  type Env,
  type TenantCredentials,
  parseTenantCredentials,
  validateCredentials,
} from './types/env.js';

// =============================================================================
// MCP Server Configuration
// =============================================================================

const SERVER_NAME = 'primrose-mcp-confluence';
const SERVER_VERSION = '1.0.0';

// =============================================================================
// MCP Agent (Stateful - uses Durable Objects)
// =============================================================================

/**
 * McpAgent provides stateful MCP sessions backed by Durable Objects.
 *
 * NOTE: For multi-tenant deployments, use the stateless mode instead.
 */
export class ConfluenceMcpAgent extends McpAgent<Env> {
  server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  async init() {
    throw new Error(
      'Stateful mode (McpAgent) is not supported for multi-tenant deployments. ' +
        'Use the stateless /mcp endpoint with appropriate headers instead.'
    );
  }
}

// =============================================================================
// Stateless MCP Server (Recommended - no Durable Objects needed)
// =============================================================================

/**
 * Creates a stateless MCP server instance with tenant-specific credentials.
 */
function createStatelessServer(credentials: TenantCredentials): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Create client with tenant-specific credentials
  const client = createConfluenceClient(credentials);

  // Register all tools
  registerSpaceTools(server, client);
  registerPageTools(server, client);
  registerBlogPostTools(server, client);
  registerCommentTools(server, client);
  registerAttachmentTools(server, client);
  registerLabelTools(server, client);
  registerTaskTools(server, client);
  registerUserTools(server, client);
  registerContentTools(server, client);
  registerSearchTools(server, client);

  // Test connection tool
  server.tool(
    'confluence_test_connection',
    'Test the connection to the Confluence API',
    {},
    async () => {
      try {
        const result = await client.testConnection();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

// =============================================================================
// Worker Export
// =============================================================================

export default {
  /**
   * Main fetch handler for the Worker
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', server: SERVER_NAME }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ==========================================================================
    // Stateless MCP with Streamable HTTP
    // ==========================================================================
    if (url.pathname === '/mcp' && request.method === 'POST') {
      // Parse tenant credentials from request headers
      const credentials = parseTenantCredentials(request);

      // Validate credentials are present
      try {
        validateCredentials(credentials);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Unauthorized',
            message: error instanceof Error ? error.message : 'Invalid credentials',
            required_headers: [
              'X-Confluence-Domain (or X-Confluence-Cloud-ID)',
              'X-Confluence-Email',
              'X-Confluence-API-Token',
            ],
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Create server with tenant-specific credentials
      const server = createStatelessServer(credentials);

      // Import and use createMcpHandler for streamable HTTP
      const { createMcpHandler } = await import('agents/mcp');
      const handler = createMcpHandler(server);
      return handler(request, env, ctx);
    }

    // SSE endpoint (not supported in stateless mode)
    if (url.pathname === '/sse') {
      return new Response('SSE endpoint requires Durable Objects. Use /mcp endpoint instead.', {
        status: 501,
      });
    }

    // Default response
    return new Response(
      JSON.stringify({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: 'Multi-tenant Confluence MCP Server for Cloudflare Workers',
        endpoints: {
          mcp: '/mcp (POST) - Streamable HTTP MCP endpoint',
          health: '/health - Health check',
        },
        authentication: {
          description: 'Pass tenant credentials via request headers',
          required_headers: {
            'X-Confluence-Domain': 'Atlassian domain (e.g., "your-company" for your-company.atlassian.net)',
            'X-Confluence-Email': 'User email for Basic Auth',
            'X-Confluence-API-Token': 'API token from id.atlassian.com',
          },
          optional_headers: {
            'X-Confluence-Cloud-ID': 'Direct Cloud ID (alternative to domain)',
          },
        },
        tools: {
          spaces: [
            'confluence_list_spaces',
            'confluence_get_space',
            'confluence_create_space',
            'confluence_delete_space',
            'confluence_get_space_permissions',
            'confluence_create_space_permission',
            'confluence_delete_space_permission',
            'confluence_get_space_properties',
            'confluence_get_space_property',
            'confluence_create_space_property',
            'confluence_update_space_property',
            'confluence_delete_space_property',
          ],
          pages: [
            'confluence_list_pages',
            'confluence_get_pages_in_space',
            'confluence_get_page',
            'confluence_create_page',
            'confluence_update_page',
            'confluence_delete_page',
            'confluence_get_page_children',
            'confluence_get_page_ancestors',
            'confluence_get_page_descendants',
            'confluence_get_page_versions',
            'confluence_get_page_version',
            'confluence_get_page_properties',
            'confluence_create_page_property',
            'confluence_update_page_property',
            'confluence_delete_page_property',
            'confluence_get_page_attachments',
            'confluence_get_page_comments',
            'confluence_get_page_operations',
            'confluence_get_page_labels',
            'confluence_add_page_labels',
            'confluence_remove_page_label',
            'confluence_get_page_likes',
            'confluence_like_page',
            'confluence_unlike_page',
          ],
          blogposts: [
            'confluence_list_blogposts',
            'confluence_get_blogposts_in_space',
            'confluence_get_blogpost',
            'confluence_create_blogpost',
            'confluence_update_blogpost',
            'confluence_delete_blogpost',
            'confluence_get_blogpost_versions',
            'confluence_get_blogpost_attachments',
            'confluence_get_blogpost_comments',
            'confluence_get_blogpost_labels',
            'confluence_add_blogpost_labels',
            'confluence_remove_blogpost_label',
          ],
          comments: [
            'confluence_list_comments',
            'confluence_get_comment',
            'confluence_create_comment',
            'confluence_update_comment',
            'confluence_delete_comment',
          ],
          attachments: [
            'confluence_list_attachments',
            'confluence_get_attachment',
            'confluence_delete_attachment',
            'confluence_get_attachment_labels',
          ],
          labels: [
            'confluence_list_labels',
            'confluence_get_label',
            'confluence_get_label_pages',
            'confluence_get_label_blogposts',
          ],
          tasks: [
            'confluence_list_tasks',
            'confluence_get_task',
            'confluence_update_task',
          ],
          users: [
            'confluence_list_users',
            'confluence_get_user',
          ],
          content: [
            'confluence_list_custom_content',
            'confluence_get_custom_content',
            'confluence_create_custom_content',
            'confluence_update_custom_content',
            'confluence_delete_custom_content',
            'confluence_list_databases',
            'confluence_get_database',
            'confluence_list_folders',
            'confluence_get_folder',
            'confluence_list_whiteboards',
            'confluence_get_whiteboard',
          ],
          search: [
            'confluence_search',
            'confluence_search_pages',
            'confluence_search_by_label',
            'confluence_search_recent',
          ],
          connection: [
            'confluence_test_connection',
          ],
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};
