/**
 * Task Tools
 *
 * MCP tools for Confluence task management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ConfluenceClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all task-related tools
 */
export function registerTaskTools(server: McpServer, client: ConfluenceClient): void {
  // ===========================================================================
  // List Tasks
  // ===========================================================================
  server.tool(
    'confluence_list_tasks',
    `List Confluence tasks (inline tasks from pages).

Args:
  - spaceId: Filter by space ID
  - pageId: Filter by page ID
  - status: Filter by status ('incomplete' or 'complete')
  - limit: Number of tasks to return (1-250, default: 25)
  - cursor: Pagination cursor
  - format: Response format

Returns:
  List of tasks with ID, status, assignee, and due date.`,
    {
      spaceId: z.string().optional().describe('Filter by space ID'),
      pageId: z.string().optional().describe('Filter by page ID'),
      status: z.enum(['incomplete', 'complete']).optional().describe('Filter by status'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ spaceId, pageId, status, limit, cursor, format }) => {
      try {
        const result = await client.listTasks({ spaceId, pageId, status, limit, cursor });
        return formatResponse(result, format, 'tasks');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Task
  // ===========================================================================
  server.tool(
    'confluence_get_task',
    `Get a specific Confluence task by ID.

Args:
  - taskId: The task ID
  - format: Response format

Returns:
  Task details including ID, status, assignee, due date, and body.`,
    {
      taskId: z.string().describe('Task ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ taskId, format }) => {
      try {
        const task = await client.getTask(taskId);
        return formatResponse(task, format, 'task');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Task
  // ===========================================================================
  server.tool(
    'confluence_update_task',
    `Update a Confluence task (mark complete/incomplete).

Args:
  - taskId: Task ID to update
  - status: New task status ('incomplete' or 'complete')

Returns:
  The updated task record.`,
    {
      taskId: z.string().describe('Task ID'),
      status: z.enum(['incomplete', 'complete']).describe('New task status'),
    },
    async ({ taskId, status }) => {
      try {
        const task = await client.updateTask(taskId, { status });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Task updated', task }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
