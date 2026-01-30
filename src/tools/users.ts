/**
 * User Tools
 *
 * MCP tools for Confluence user management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ConfluenceClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all user-related tools
 */
export function registerUserTools(server: McpServer, client: ConfluenceClient): void {
  // ===========================================================================
  // List Users
  // ===========================================================================
  server.tool(
    'confluence_list_users',
    `List Confluence users.

Args:
  - limit: Number of users to return (1-250, default: 25)
  - cursor: Pagination cursor
  - format: Response format

Returns:
  List of users with account ID, name, and type.`,
    {
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ limit, cursor, format }) => {
      try {
        const result = await client.listUsers({ limit, cursor });
        return formatResponse(result, format, 'users');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get User
  // ===========================================================================
  server.tool(
    'confluence_get_user',
    `Get a specific Confluence user by account ID.

Args:
  - accountId: The user's account ID
  - format: Response format

Returns:
  User details including account ID, name, email, and profile picture.`,
    {
      accountId: z.string().describe('User account ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ accountId, format }) => {
      try {
        const user = await client.getUser(accountId);
        return formatResponse(user, format, 'user');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
