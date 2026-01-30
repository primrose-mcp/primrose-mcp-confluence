/**
 * Search Tools
 *
 * MCP tools for Confluence search using CQL (Confluence Query Language).
 * Note: Search uses the v1 API as there is no v2 search endpoint.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ConfluenceClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register search tools
 */
export function registerSearchTools(server: McpServer, client: ConfluenceClient): void {
  // ===========================================================================
  // Search
  // ===========================================================================
  server.tool(
    'confluence_search',
    `Search Confluence using CQL (Confluence Query Language).

CQL Examples:
  - type=page AND space=DEV
  - text ~ "project documentation"
  - creator=currentUser() AND created > "2024-01-01"
  - label="important" AND type=page
  - title ~ "meeting notes" AND space.key=TEAM

Common CQL Fields:
  - type: content type (page, blogpost, attachment, comment)
  - space: space key or ID
  - title: content title
  - text: full-text search
  - label: content label
  - creator: content creator
  - created: creation date
  - lastModified: last modification date

Args:
  - cql: CQL query string
  - excerpt: Include search excerpts (default: true)
  - limit: Number of results to return (1-250, default: 25)
  - cursor: Pagination cursor
  - format: Response format

Returns:
  Search results with title, type, space, excerpt, and last modified.`,
    {
      cql: z.string().describe('CQL query string'),
      excerpt: z.boolean().default(true).describe('Include search excerpts'),
      limit: z.number().int().min(1).max(250).default(25),
      cursor: z.string().optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ cql, excerpt, limit, cursor, format }) => {
      try {
        const result = await client.search(cql, { excerpt, limit, cursor });
        return formatResponse(result, format, 'search');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Search Pages
  // ===========================================================================
  server.tool(
    'confluence_search_pages',
    `Search for Confluence pages using text query.

This is a convenience wrapper around CQL search for finding pages.

Args:
  - query: Search text query
  - spaceKey: Filter by space key (optional)
  - limit: Number of results to return (1-250, default: 25)
  - format: Response format

Returns:
  Search results matching the query.`,
    {
      query: z.string().describe('Search text query'),
      spaceKey: z.string().optional().describe('Filter by space key'),
      limit: z.number().int().min(1).max(250).default(25),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ query, spaceKey, limit, format }) => {
      try {
        let cql = `type=page AND text ~ "${query.replace(/"/g, '\\"')}"`;
        if (spaceKey) {
          cql += ` AND space.key="${spaceKey}"`;
        }
        const result = await client.search(cql, { excerpt: true, limit });
        return formatResponse(result, format, 'search');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Search by Label
  // ===========================================================================
  server.tool(
    'confluence_search_by_label',
    `Search for Confluence content by label.

Args:
  - label: Label name to search for
  - contentType: Filter by content type ('page' or 'blogpost', optional)
  - spaceKey: Filter by space key (optional)
  - limit: Number of results to return (1-250, default: 25)
  - format: Response format

Returns:
  Content with the specified label.`,
    {
      label: z.string().describe('Label name'),
      contentType: z.enum(['page', 'blogpost']).optional().describe('Filter by content type'),
      spaceKey: z.string().optional().describe('Filter by space key'),
      limit: z.number().int().min(1).max(250).default(25),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ label, contentType, spaceKey, limit, format }) => {
      try {
        let cql = `label="${label.replace(/"/g, '\\"')}"`;
        if (contentType) {
          cql += ` AND type=${contentType}`;
        }
        if (spaceKey) {
          cql += ` AND space.key="${spaceKey}"`;
        }
        const result = await client.search(cql, { excerpt: true, limit });
        return formatResponse(result, format, 'search');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Search Recently Modified
  // ===========================================================================
  server.tool(
    'confluence_search_recent',
    `Search for recently modified Confluence content.

Args:
  - days: Number of days to look back (default: 7)
  - contentType: Filter by content type ('page' or 'blogpost', optional)
  - spaceKey: Filter by space key (optional)
  - limit: Number of results to return (1-250, default: 25)
  - format: Response format

Returns:
  Recently modified content.`,
    {
      days: z.number().int().min(1).max(365).default(7).describe('Days to look back'),
      contentType: z.enum(['page', 'blogpost']).optional(),
      spaceKey: z.string().optional(),
      limit: z.number().int().min(1).max(250).default(25),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ days, contentType, spaceKey, limit, format }) => {
      try {
        const date = new Date();
        date.setDate(date.getDate() - days);
        const dateStr = date.toISOString().split('T')[0];

        let cql = `lastModified >= "${dateStr}"`;
        if (contentType) {
          cql += ` AND type=${contentType}`;
        } else {
          cql += ` AND (type=page OR type=blogpost)`;
        }
        if (spaceKey) {
          cql += ` AND space.key="${spaceKey}"`;
        }
        cql += ' ORDER BY lastModified DESC';

        const result = await client.search(cql, { excerpt: true, limit });
        return formatResponse(result, format, 'search');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
