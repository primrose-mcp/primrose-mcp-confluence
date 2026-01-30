/**
 * Response Formatting Utilities
 *
 * Helpers for formatting tool responses in JSON or Markdown.
 */

import type {
  Attachment,
  BlogPost,
  Comment,
  Label,
  Page,
  PaginatedResponse,
  ResponseFormat,
  SearchResult,
  Space,
  Task,
  User,
} from '../types/entities.js';
import { ConfluenceApiError, formatErrorForLogging } from './errors.js';

/**
 * MCP tool response type
 * Note: Index signature required for MCP SDK 1.25+ compatibility
 */
export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Format a successful response
 */
export function formatResponse(
  data: unknown,
  format: ResponseFormat,
  entityType: string
): ToolResponse {
  if (format === 'markdown') {
    return {
      content: [{ type: 'text', text: formatAsMarkdown(data, entityType) }],
    };
  }
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Format an error response
 */
export function formatError(error: unknown): ToolResponse {
  const errorInfo = formatErrorForLogging(error);

  let message: string;
  if (error instanceof ConfluenceApiError) {
    message = `Error: ${error.message}`;
    if (error.retryable) {
      message += ' (retryable)';
    }
  } else if (error instanceof Error) {
    message = `Error: ${error.message}`;
  } else {
    message = `Error: ${String(error)}`;
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: message, details: errorInfo }, null, 2),
      },
    ],
    isError: true,
  };
}

/**
 * Format data as Markdown
 */
function formatAsMarkdown(data: unknown, entityType: string): string {
  if (isPaginatedResponse(data)) {
    return formatPaginatedAsMarkdown(data, entityType);
  }

  if (Array.isArray(data)) {
    return formatArrayAsMarkdown(data, entityType);
  }

  if (typeof data === 'object' && data !== null) {
    return formatObjectAsMarkdown(data as Record<string, unknown>, entityType);
  }

  return String(data);
}

/**
 * Type guard for paginated response
 */
function isPaginatedResponse(data: unknown): data is PaginatedResponse<unknown> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'results' in data &&
    Array.isArray((data as PaginatedResponse<unknown>).results)
  );
}

/**
 * Format paginated response as Markdown
 */
function formatPaginatedAsMarkdown(data: PaginatedResponse<unknown>, entityType: string): string {
  const lines: string[] = [];
  const count = data.results.length;
  const hasMore = !!data._links?.next;

  lines.push(`## ${capitalize(entityType)}`);
  lines.push('');
  lines.push(`**Showing:** ${count}`);

  if (hasMore) {
    lines.push('**More available:** Yes');
  }
  lines.push('');

  if (data.results.length === 0) {
    lines.push('_No items found._');
    return lines.join('\n');
  }

  // Format items based on entity type
  switch (entityType) {
    case 'spaces':
      lines.push(formatSpacesTable(data.results as Space[]));
      break;
    case 'pages':
      lines.push(formatPagesTable(data.results as Page[]));
      break;
    case 'blogposts':
      lines.push(formatBlogPostsTable(data.results as BlogPost[]));
      break;
    case 'comments':
      lines.push(formatCommentsTable(data.results as Comment[]));
      break;
    case 'attachments':
      lines.push(formatAttachmentsTable(data.results as Attachment[]));
      break;
    case 'labels':
      lines.push(formatLabelsTable(data.results as Label[]));
      break;
    case 'tasks':
      lines.push(formatTasksTable(data.results as Task[]));
      break;
    case 'users':
      lines.push(formatUsersTable(data.results as User[]));
      break;
    case 'search':
      lines.push(formatSearchResultsTable(data.results as SearchResult[]));
      break;
    default:
      lines.push(formatGenericTable(data.results));
  }

  return lines.join('\n');
}

/**
 * Format spaces as Markdown table
 */
function formatSpacesTable(spaces: Space[]): string {
  const lines: string[] = [];
  lines.push('| ID | Key | Name | Type | Status |');
  lines.push('|---|---|---|---|---|');

  for (const space of spaces) {
    lines.push(
      `| ${space.id} | ${space.key} | ${space.name} | ${space.type} | ${space.status} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format pages as Markdown table
 */
function formatPagesTable(pages: Page[]): string {
  const lines: string[] = [];
  lines.push('| ID | Title | Space ID | Status | Version |');
  lines.push('|---|---|---|---|---|');

  for (const page of pages) {
    lines.push(
      `| ${page.id} | ${page.title} | ${page.spaceId} | ${page.status} | ${page.version?.number || '-'} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format blog posts as Markdown table
 */
function formatBlogPostsTable(posts: BlogPost[]): string {
  const lines: string[] = [];
  lines.push('| ID | Title | Space ID | Status | Created |');
  lines.push('|---|---|---|---|---|');

  for (const post of posts) {
    const created = post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '-';
    lines.push(
      `| ${post.id} | ${post.title} | ${post.spaceId} | ${post.status} | ${created} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format comments as Markdown table
 */
function formatCommentsTable(comments: Comment[]): string {
  const lines: string[] = [];
  lines.push('| ID | Status | Created | Version |');
  lines.push('|---|---|---|---|');

  for (const comment of comments) {
    const created = comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : '-';
    lines.push(
      `| ${comment.id} | ${comment.status} | ${created} | ${comment.version?.number || '-'} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format attachments as Markdown table
 */
function formatAttachmentsTable(attachments: Attachment[]): string {
  const lines: string[] = [];
  lines.push('| ID | Title | Media Type | Size |');
  lines.push('|---|---|---|---|');

  for (const attachment of attachments) {
    const size = attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : '-';
    lines.push(
      `| ${attachment.id} | ${attachment.title} | ${attachment.mediaType || '-'} | ${size} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format labels as Markdown table
 */
function formatLabelsTable(labels: Label[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Prefix |');
  lines.push('|---|---|---|');

  for (const label of labels) {
    lines.push(`| ${label.id} | ${label.name} | ${label.prefix} |`);
  }

  return lines.join('\n');
}

/**
 * Format tasks as Markdown table
 */
function formatTasksTable(tasks: Task[]): string {
  const lines: string[] = [];
  lines.push('| ID | Status | Assigned To | Due Date |');
  lines.push('|---|---|---|---|');

  for (const task of tasks) {
    const dueDate = task.dueAt ? new Date(task.dueAt).toLocaleDateString() : '-';
    lines.push(`| ${task.id} | ${task.status} | ${task.assignedTo || '-'} | ${dueDate} |`);
  }

  return lines.join('\n');
}

/**
 * Format users as Markdown table
 */
function formatUsersTable(users: User[]): string {
  const lines: string[] = [];
  lines.push('| Account ID | Name | Type |');
  lines.push('|---|---|---|');

  for (const user of users) {
    const name = user.displayName || user.publicName || '-';
    lines.push(`| ${user.accountId} | ${name} | ${user.accountType} |`);
  }

  return lines.join('\n');
}

/**
 * Format search results as Markdown table
 */
function formatSearchResultsTable(results: SearchResult[]): string {
  const lines: string[] = [];
  lines.push('| Title | Type | Space | Last Modified |');
  lines.push('|---|---|---|---|');

  for (const result of results) {
    const title = result.content?.title || result.title || '-';
    const type = result.content?.type || '-';
    const space = result.content?.space?.name || result.resultGlobalContainer?.title || '-';
    const modified = result.friendlyLastModified || '-';
    lines.push(`| ${title} | ${type} | ${space} | ${modified} |`);
  }

  return lines.join('\n');
}

/**
 * Format a generic array as Markdown table
 */
function formatGenericTable(items: unknown[]): string {
  if (items.length === 0) return '_No items_';

  const first = items[0] as Record<string, unknown>;
  const keys = Object.keys(first).slice(0, 5); // Limit columns

  const lines: string[] = [];
  lines.push(`| ${keys.join(' | ')} |`);
  lines.push(`|${keys.map(() => '---').join('|')}|`);

  for (const item of items) {
    const record = item as Record<string, unknown>;
    const values = keys.map((k) => String(record[k] ?? '-'));
    lines.push(`| ${values.join(' | ')} |`);
  }

  return lines.join('\n');
}

/**
 * Format an array as Markdown
 */
function formatArrayAsMarkdown(data: unknown[], entityType: string): string {
  return formatGenericTable(data);
}

/**
 * Format a single object as Markdown
 */
function formatObjectAsMarkdown(data: Record<string, unknown>, entityType: string): string {
  const lines: string[] = [];
  lines.push(`## ${capitalize(entityType.replace(/s$/, ''))}`);
  lines.push('');

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;

    if (typeof value === 'object') {
      lines.push(`**${formatKey(key)}:**`);
      lines.push('```json');
      lines.push(JSON.stringify(value, null, 2));
      lines.push('```');
    } else {
      lines.push(`**${formatKey(key)}:** ${value}`);
    }
  }

  return lines.join('\n');
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a key for display (camelCase to Title Case)
 */
function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
