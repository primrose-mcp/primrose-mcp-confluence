/**
 * Space Tools
 *
 * MCP tools for Confluence space management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ConfluenceClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all space-related tools
 */
export function registerSpaceTools(server: McpServer, client: ConfluenceClient): void {
  // ===========================================================================
  // List Spaces
  // ===========================================================================
  server.tool(
    'confluence_list_spaces',
    `List all Confluence spaces with pagination.

Args:
  - type: Filter by space type ('global' or 'personal')
  - status: Filter by status ('current' or 'archived')
  - limit: Number of spaces to return (1-250, default: 25)
  - cursor: Pagination cursor from previous response
  - format: Response format ('json' or 'markdown')

Returns:
  List of spaces with ID, key, name, type, and status.`,
    {
      type: z.enum(['global', 'personal']).optional().describe('Filter by space type'),
      status: z.enum(['current', 'archived']).optional().describe('Filter by status'),
      limit: z.number().int().min(1).max(250).default(25).describe('Number of spaces to return'),
      cursor: z.string().optional().describe('Pagination cursor from previous response'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ type, status, limit, cursor, format }) => {
      try {
        const result = await client.listSpaces({ type, status, limit, cursor });
        return formatResponse(result, format, 'spaces');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Space
  // ===========================================================================
  server.tool(
    'confluence_get_space',
    `Get a specific Confluence space by ID.

Args:
  - spaceId: The space ID (UUID format)
  - format: Response format ('json' or 'markdown')

Returns:
  Space details including ID, key, name, type, status, and description.`,
    {
      spaceId: z.string().describe('Space ID (UUID)'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ spaceId, format }) => {
      try {
        const space = await client.getSpace(spaceId);
        return formatResponse(space, format, 'space');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Space
  // ===========================================================================
  server.tool(
    'confluence_create_space',
    `Create a new Confluence space.

Args:
  - key: Unique space key (e.g., 'PROJ', 'DOCS')
  - name: Display name for the space
  - description: Optional plain text description
  - type: Space type ('global' or 'personal', default: 'global')

Returns:
  The created space record.`,
    {
      key: z.string().min(1).max(255).describe('Unique space key'),
      name: z.string().min(1).max(200).describe('Space display name'),
      description: z.string().optional().describe('Plain text description'),
      type: z.enum(['global', 'personal']).default('global').describe('Space type'),
    },
    async ({ key, name, description, type }) => {
      try {
        const space = await client.createSpace({
          key,
          name,
          description: description ? { plain: { value: description } } : undefined,
          type,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Space created', space }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Space
  // ===========================================================================
  server.tool(
    'confluence_delete_space',
    `Delete a Confluence space.

WARNING: This permanently deletes the space and all its content!

Args:
  - spaceId: The space ID to delete

Returns:
  Confirmation of deletion.`,
    {
      spaceId: z.string().describe('Space ID to delete'),
    },
    async ({ spaceId }) => {
      try {
        await client.deleteSpace(spaceId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: `Space ${spaceId} deleted` }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Space Permissions
  // ===========================================================================
  server.tool(
    'confluence_get_space_permissions',
    `Get permissions for a Confluence space.

Args:
  - spaceId: The space ID
  - limit: Number of permissions to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of space permissions with principal and operation details.`,
    {
      spaceId: z.string().describe('Space ID'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ spaceId, limit, cursor }) => {
      try {
        const result = await client.getSpacePermissions(spaceId, { limit, cursor });
        return formatResponse(result, 'json', 'permissions');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Space Permission
  // ===========================================================================
  server.tool(
    'confluence_create_space_permission',
    `Create a permission for a Confluence space.

Args:
  - spaceId: The space ID
  - principalType: Type of principal ('user' or 'group')
  - principalId: ID of the user or group
  - operationKey: Permission operation key (e.g., 'read', 'write', 'administer')
  - operationTarget: Target type for the operation

Returns:
  The created permission record.`,
    {
      spaceId: z.string().describe('Space ID'),
      principalType: z.enum(['user', 'group']).describe('Principal type'),
      principalId: z.string().describe('User or group ID'),
      operationKey: z.string().describe('Permission operation key'),
      operationTarget: z.string().describe('Operation target type'),
    },
    async ({ spaceId, principalType, principalId, operationKey, operationTarget }) => {
      try {
        const permission = await client.createSpacePermission(spaceId, {
          principal: { type: principalType, id: principalId },
          operation: { key: operationKey, target: operationTarget },
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Permission created', permission }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Space Permission
  // ===========================================================================
  server.tool(
    'confluence_delete_space_permission',
    `Delete a permission from a Confluence space.

Args:
  - spaceId: The space ID
  - permissionId: The permission ID to delete

Returns:
  Confirmation of deletion.`,
    {
      spaceId: z.string().describe('Space ID'),
      permissionId: z.string().describe('Permission ID to delete'),
    },
    async ({ spaceId, permissionId }) => {
      try {
        await client.deleteSpacePermission(spaceId, permissionId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Permission deleted' }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Space Properties
  // ===========================================================================
  server.tool(
    'confluence_get_space_properties',
    `Get properties for a Confluence space.

Args:
  - spaceId: The space ID
  - limit: Number of properties to return (1-250, default: 25)
  - cursor: Pagination cursor

Returns:
  List of space properties with key-value pairs.`,
    {
      spaceId: z.string().describe('Space ID'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
    },
    async ({ spaceId, limit, cursor }) => {
      try {
        const result = await client.getSpaceProperties(spaceId, { limit, cursor });
        return formatResponse(result, 'json', 'properties');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Space Property
  // ===========================================================================
  server.tool(
    'confluence_get_space_property',
    `Get a specific property from a Confluence space.

Args:
  - spaceId: The space ID
  - propertyKey: The property key

Returns:
  The property with its value.`,
    {
      spaceId: z.string().describe('Space ID'),
      propertyKey: z.string().describe('Property key'),
    },
    async ({ spaceId, propertyKey }) => {
      try {
        const property = await client.getSpaceProperty(spaceId, propertyKey);
        return formatResponse(property, 'json', 'property');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Space Property
  // ===========================================================================
  server.tool(
    'confluence_create_space_property',
    `Create a property for a Confluence space.

Args:
  - spaceId: The space ID
  - key: Property key
  - value: Property value (any JSON value)

Returns:
  The created property.`,
    {
      spaceId: z.string().describe('Space ID'),
      key: z.string().describe('Property key'),
      value: z.any().describe('Property value (JSON)'),
    },
    async ({ spaceId, key, value }) => {
      try {
        const property = await client.createSpaceProperty(spaceId, { key, value });
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
  // Update Space Property
  // ===========================================================================
  server.tool(
    'confluence_update_space_property',
    `Update a property for a Confluence space.

Args:
  - spaceId: The space ID
  - propertyKey: Property key
  - value: New property value
  - version: Current version number

Returns:
  The updated property.`,
    {
      spaceId: z.string().describe('Space ID'),
      propertyKey: z.string().describe('Property key'),
      value: z.any().describe('New property value (JSON)'),
      version: z.number().int().describe('Current version number'),
    },
    async ({ spaceId, propertyKey, value, version }) => {
      try {
        const property = await client.updateSpaceProperty(spaceId, propertyKey, {
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
  // Delete Space Property
  // ===========================================================================
  server.tool(
    'confluence_delete_space_property',
    `Delete a property from a Confluence space.

Args:
  - spaceId: The space ID
  - propertyKey: Property key to delete

Returns:
  Confirmation of deletion.`,
    {
      spaceId: z.string().describe('Space ID'),
      propertyKey: z.string().describe('Property key'),
    },
    async ({ spaceId, propertyKey }) => {
      try {
        await client.deleteSpaceProperty(spaceId, propertyKey);
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
}
