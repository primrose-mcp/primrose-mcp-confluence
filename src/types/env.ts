/**
 * Environment Bindings
 *
 * Type definitions for Cloudflare Worker environment variables and bindings.
 *
 * MULTI-TENANT ARCHITECTURE:
 * This server supports multiple tenants. Tenant-specific credentials are passed
 * via request headers, NOT stored in wrangler secrets. This allows a single
 * server instance to serve multiple customers.
 *
 * Request Headers:
 * - X-Confluence-Domain: Atlassian domain (e.g., "your-company")
 * - X-Confluence-Email: User email for Basic Auth
 * - X-Confluence-API-Token: API token from id.atlassian.com
 */

// =============================================================================
// Tenant Credentials (parsed from request headers)
// =============================================================================

export interface TenantCredentials {
  /** Atlassian domain (e.g., "your-company" for your-company.atlassian.net) */
  domain: string;

  /** User email for Basic Auth */
  email: string;

  /** API token from id.atlassian.com */
  apiToken: string;

  /** Direct Cloud ID (alternative to domain) */
  cloudId?: string;
}

/**
 * Parse tenant credentials from request headers
 */
export function parseTenantCredentials(request: Request): TenantCredentials {
  const headers = request.headers;

  return {
    domain: headers.get('X-Confluence-Domain') || '',
    email: headers.get('X-Confluence-Email') || '',
    apiToken: headers.get('X-Confluence-API-Token') || '',
    cloudId: headers.get('X-Confluence-Cloud-ID') || undefined,
  };
}

/**
 * Validate that required credentials are present
 */
export function validateCredentials(credentials: TenantCredentials): void {
  if (!credentials.domain && !credentials.cloudId) {
    throw new Error(
      'Missing credentials. Provide X-Confluence-Domain or X-Confluence-Cloud-ID header.'
    );
  }
  if (!credentials.email) {
    throw new Error('Missing credentials. Provide X-Confluence-Email header.');
  }
  if (!credentials.apiToken) {
    throw new Error('Missing credentials. Provide X-Confluence-API-Token header.');
  }
}

// =============================================================================
// Environment Configuration (from wrangler.jsonc vars and bindings)
// =============================================================================

export interface Env {
  // ===========================================================================
  // Environment Variables (from wrangler.jsonc vars)
  // ===========================================================================

  /** Maximum character limit for responses */
  CHARACTER_LIMIT: string;

  /** Default page size for list operations */
  DEFAULT_PAGE_SIZE: string;

  /** Maximum page size allowed */
  MAX_PAGE_SIZE: string;

  // ===========================================================================
  // Bindings
  // ===========================================================================

  /** KV namespace for caching */
  CONFLUENCE_KV?: KVNamespace;

  /** Durable Object namespace for MCP sessions */
  MCP_SESSIONS?: DurableObjectNamespace;

  /** Cloudflare AI binding (optional) */
  AI?: Ai;
}

// ===========================================================================
// Helper Functions
// ===========================================================================

/**
 * Get a numeric environment value with a default
 */
export function getEnvNumber(env: Env, key: keyof Env, defaultValue: number): number {
  const value = env[key];
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Get the character limit from environment
 */
export function getCharacterLimit(env: Env): number {
  return getEnvNumber(env, 'CHARACTER_LIMIT', 50000);
}

/**
 * Get the default page size from environment
 */
export function getDefaultPageSize(env: Env): number {
  return getEnvNumber(env, 'DEFAULT_PAGE_SIZE', 25);
}

/**
 * Get the maximum page size from environment
 */
export function getMaxPageSize(env: Env): number {
  return getEnvNumber(env, 'MAX_PAGE_SIZE', 250);
}
