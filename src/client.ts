/**
 * Confluence API Client
 *
 * Handles all HTTP communication with the Confluence REST API v2.
 *
 * MULTI-TENANT: This client receives credentials per-request via TenantCredentials,
 * allowing a single server to serve multiple tenants with different API keys.
 *
 * Base URL: https://{domain}.atlassian.net/wiki/api/v2
 * Auth: Basic Auth with email and API token
 */

import type {
  Ancestor,
  Attachment,
  BlogPost,
  BlogPostCreateInput,
  BlogPostUpdateInput,
  Child,
  Comment,
  CommentCreateInput,
  CommentUpdateInput,
  ContentProperty,
  ContentPropertyCreateInput,
  ContentPropertyUpdateInput,
  CustomContent,
  CustomContentCreateInput,
  CustomContentUpdateInput,
  Database,
  Folder,
  Label,
  LabelInput,
  Like,
  Operation,
  Page,
  PageCreateInput,
  PageUpdateInput,
  PaginatedResponse,
  PaginationParams,
  SearchResult,
  Space,
  SpaceCreateInput,
  SpacePermission,
  SpacePermissionCreateInput,
  SpaceProperty,
  SpacePropertyCreateInput,
  SpacePropertyUpdateInput,
  Task,
  TaskUpdateInput,
  User,
  Version,
  Whiteboard,
  BodyFormat,
} from './types/entities.js';
import type { TenantCredentials } from './types/env.js';
import {
  AuthenticationError,
  ConfluenceApiError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
} from './utils/errors.js';

// =============================================================================
// Confluence Client Interface
// =============================================================================

export interface ConfluenceClient {
  // Connection
  testConnection(): Promise<{ connected: boolean; message: string }>;

  // Spaces
  listSpaces(params?: PaginationParams & { type?: string; status?: string }): Promise<PaginatedResponse<Space>>;
  getSpace(spaceId: string): Promise<Space>;
  createSpace(input: SpaceCreateInput): Promise<Space>;
  deleteSpace(spaceId: string): Promise<void>;

  // Pages
  listPages(params?: PaginationParams & { spaceId?: string; status?: string; title?: string; bodyFormat?: BodyFormat }): Promise<PaginatedResponse<Page>>;
  getPage(pageId: string, bodyFormat?: BodyFormat): Promise<Page>;
  createPage(input: PageCreateInput): Promise<Page>;
  updatePage(pageId: string, input: PageUpdateInput): Promise<Page>;
  deletePage(pageId: string, purge?: boolean): Promise<void>;
  getPagesBySpaceId(spaceId: string, params?: PaginationParams & { status?: string; bodyFormat?: BodyFormat }): Promise<PaginatedResponse<Page>>;
  getPageChildren(pageId: string, params?: PaginationParams): Promise<PaginatedResponse<Child>>;
  getPageAncestors(pageId: string): Promise<Ancestor[]>;
  getPageDescendants(pageId: string, params?: PaginationParams): Promise<PaginatedResponse<Page>>;

  // Page Labels
  getPageLabels(pageId: string, params?: PaginationParams & { prefix?: string }): Promise<PaginatedResponse<Label>>;
  addPageLabels(pageId: string, labels: LabelInput[]): Promise<Label[]>;
  removePageLabel(pageId: string, labelId: string): Promise<void>;

  // Page Likes
  getPageLikes(pageId: string, params?: PaginationParams): Promise<PaginatedResponse<Like>>;
  likePage(pageId: string): Promise<void>;
  unlikePage(pageId: string): Promise<void>;

  // Page Versions
  getPageVersions(pageId: string, params?: PaginationParams): Promise<PaginatedResponse<Version>>;
  getPageVersion(pageId: string, versionNumber: number): Promise<Version>;

  // Page Properties
  getPageProperties(pageId: string, params?: PaginationParams): Promise<PaginatedResponse<ContentProperty>>;
  getPageProperty(pageId: string, propertyKey: string): Promise<ContentProperty>;
  createPageProperty(pageId: string, input: ContentPropertyCreateInput): Promise<ContentProperty>;
  updatePageProperty(pageId: string, propertyKey: string, input: ContentPropertyUpdateInput): Promise<ContentProperty>;
  deletePageProperty(pageId: string, propertyKey: string): Promise<void>;

  // Page Attachments
  getPageAttachments(pageId: string, params?: PaginationParams): Promise<PaginatedResponse<Attachment>>;

  // Page Comments
  getPageComments(pageId: string, params?: PaginationParams & { bodyFormat?: BodyFormat }): Promise<PaginatedResponse<Comment>>;

  // Page Operations
  getPageOperations(pageId: string): Promise<Operation[]>;

  // Blog Posts
  listBlogPosts(params?: PaginationParams & { spaceId?: string; status?: string; title?: string; bodyFormat?: BodyFormat }): Promise<PaginatedResponse<BlogPost>>;
  getBlogPost(blogPostId: string, bodyFormat?: BodyFormat): Promise<BlogPost>;
  createBlogPost(input: BlogPostCreateInput): Promise<BlogPost>;
  updateBlogPost(blogPostId: string, input: BlogPostUpdateInput): Promise<BlogPost>;
  deleteBlogPost(blogPostId: string, purge?: boolean): Promise<void>;
  getBlogPostsBySpaceId(spaceId: string, params?: PaginationParams & { status?: string; bodyFormat?: BodyFormat }): Promise<PaginatedResponse<BlogPost>>;

  // Blog Post Labels
  getBlogPostLabels(blogPostId: string, params?: PaginationParams & { prefix?: string }): Promise<PaginatedResponse<Label>>;
  addBlogPostLabels(blogPostId: string, labels: LabelInput[]): Promise<Label[]>;
  removeBlogPostLabel(blogPostId: string, labelId: string): Promise<void>;

  // Blog Post Versions
  getBlogPostVersions(blogPostId: string, params?: PaginationParams): Promise<PaginatedResponse<Version>>;

  // Blog Post Attachments
  getBlogPostAttachments(blogPostId: string, params?: PaginationParams): Promise<PaginatedResponse<Attachment>>;

  // Blog Post Comments
  getBlogPostComments(blogPostId: string, params?: PaginationParams & { bodyFormat?: BodyFormat }): Promise<PaginatedResponse<Comment>>;

  // Comments
  listComments(params?: PaginationParams & { bodyFormat?: BodyFormat }): Promise<PaginatedResponse<Comment>>;
  getComment(commentId: string, bodyFormat?: BodyFormat): Promise<Comment>;
  createComment(input: CommentCreateInput): Promise<Comment>;
  updateComment(commentId: string, input: CommentUpdateInput): Promise<Comment>;
  deleteComment(commentId: string): Promise<void>;

  // Attachments
  listAttachments(params?: PaginationParams & { status?: string; mediaType?: string; filename?: string }): Promise<PaginatedResponse<Attachment>>;
  getAttachment(attachmentId: string): Promise<Attachment>;
  deleteAttachment(attachmentId: string, purge?: boolean): Promise<void>;
  getAttachmentLabels(attachmentId: string, params?: PaginationParams): Promise<PaginatedResponse<Label>>;

  // Labels
  listLabels(params?: PaginationParams & { prefix?: string }): Promise<PaginatedResponse<Label>>;
  getLabel(labelId: string): Promise<Label>;
  getLabelPages(labelId: string, params?: PaginationParams & { bodyFormat?: BodyFormat }): Promise<PaginatedResponse<Page>>;
  getLabelBlogPosts(labelId: string, params?: PaginationParams & { bodyFormat?: BodyFormat }): Promise<PaginatedResponse<BlogPost>>;

  // Tasks
  listTasks(params?: PaginationParams & { spaceId?: string; pageId?: string; status?: string }): Promise<PaginatedResponse<Task>>;
  getTask(taskId: string): Promise<Task>;
  updateTask(taskId: string, input: TaskUpdateInput): Promise<Task>;

  // Users
  listUsers(params?: PaginationParams): Promise<PaginatedResponse<User>>;
  getUser(accountId: string): Promise<User>;

  // Custom Content
  listCustomContent(params?: PaginationParams & { type?: string; spaceId?: string }): Promise<PaginatedResponse<CustomContent>>;
  getCustomContent(customContentId: string, bodyFormat?: BodyFormat): Promise<CustomContent>;
  createCustomContent(input: CustomContentCreateInput): Promise<CustomContent>;
  updateCustomContent(customContentId: string, input: CustomContentUpdateInput): Promise<CustomContent>;
  deleteCustomContent(customContentId: string, purge?: boolean): Promise<void>;

  // Space Permissions
  getSpacePermissions(spaceId: string, params?: PaginationParams): Promise<PaginatedResponse<SpacePermission>>;
  createSpacePermission(spaceId: string, input: SpacePermissionCreateInput): Promise<SpacePermission>;
  deleteSpacePermission(spaceId: string, permissionId: string): Promise<void>;

  // Space Properties
  getSpaceProperties(spaceId: string, params?: PaginationParams): Promise<PaginatedResponse<SpaceProperty>>;
  getSpaceProperty(spaceId: string, propertyKey: string): Promise<SpaceProperty>;
  createSpaceProperty(spaceId: string, input: SpacePropertyCreateInput): Promise<SpaceProperty>;
  updateSpaceProperty(spaceId: string, propertyKey: string, input: SpacePropertyUpdateInput): Promise<SpaceProperty>;
  deleteSpaceProperty(spaceId: string, propertyKey: string): Promise<void>;

  // Databases
  listDatabases(params?: PaginationParams & { spaceId?: string }): Promise<PaginatedResponse<Database>>;
  getDatabase(databaseId: string): Promise<Database>;

  // Folders
  listFolders(params?: PaginationParams & { spaceId?: string }): Promise<PaginatedResponse<Folder>>;
  getFolder(folderId: string): Promise<Folder>;

  // Whiteboards
  listWhiteboards(params?: PaginationParams & { spaceId?: string }): Promise<PaginatedResponse<Whiteboard>>;
  getWhiteboard(whiteboardId: string): Promise<Whiteboard>;

  // Search (v1 API - CQL)
  search(cql: string, params?: PaginationParams & { excerpt?: boolean }): Promise<PaginatedResponse<SearchResult>>;
}

// =============================================================================
// Confluence Client Implementation
// =============================================================================

class ConfluenceClientImpl implements ConfluenceClient {
  private credentials: TenantCredentials;
  private baseUrl: string;
  private searchBaseUrl: string;

  constructor(credentials: TenantCredentials) {
    this.credentials = credentials;
    this.baseUrl = `https://${credentials.domain}.atlassian.net/wiki/api/v2`;
    this.searchBaseUrl = `https://${credentials.domain}.atlassian.net/wiki/rest/api`;
  }

  // ===========================================================================
  // HTTP Request Helper
  // ===========================================================================

  private getAuthHeaders(): Record<string, string> {
    const credentials = btoa(`${this.credentials.email}:${this.credentials.apiToken}`);
    return {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, useSearchApi = false): Promise<T> {
    const baseUrl = useSearchApi ? this.searchBaseUrl : this.baseUrl;
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError('Rate limit exceeded', retryAfter ? parseInt(retryAfter, 10) : 60);
    }

    // Handle authentication errors
    if (response.status === 401) {
      throw new AuthenticationError('Authentication failed. Check your credentials.');
    }

    // Handle forbidden errors
    if (response.status === 403) {
      throw new ForbiddenError('Access denied. Check your permissions.');
    }

    // Handle not found errors
    if (response.status === 404) {
      throw new NotFoundError('Resource', endpoint);
    }

    // Handle other errors
    if (!response.ok) {
      const errorBody = await response.text();
      let message = `API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        message = errorJson.message || errorJson.error || errorJson.errors?.[0]?.message || message;
      } catch {
        // Use default message
      }
      throw new ConfluenceApiError(message, response.status);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  private buildQueryString<T extends object>(params: T): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (key === 'bodyFormat' && value) {
          searchParams.set('body-format', String(value));
        } else {
          searchParams.set(key, String(value));
        }
      }
    }
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // ===========================================================================
  // Connection
  // ===========================================================================

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      await this.request<PaginatedResponse<Space>>('/spaces?limit=1');
      return { connected: true, message: 'Successfully connected to Confluence' };
    } catch (error) {
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  // ===========================================================================
  // Spaces
  // ===========================================================================

  async listSpaces(params?: PaginationParams & { type?: string; status?: string }): Promise<PaginatedResponse<Space>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Space>>(`/spaces${query}`);
  }

  async getSpace(spaceId: string): Promise<Space> {
    return this.request<Space>(`/spaces/${spaceId}`);
  }

  async createSpace(input: SpaceCreateInput): Promise<Space> {
    return this.request<Space>('/spaces', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async deleteSpace(spaceId: string): Promise<void> {
    await this.request<void>(`/spaces/${spaceId}`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // Pages
  // ===========================================================================

  async listPages(params?: PaginationParams & { spaceId?: string; status?: string; title?: string; bodyFormat?: BodyFormat }): Promise<PaginatedResponse<Page>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Page>>(`/pages${query}`);
  }

  async getPage(pageId: string, bodyFormat?: BodyFormat): Promise<Page> {
    const query = bodyFormat ? `?body-format=${bodyFormat}` : '';
    return this.request<Page>(`/pages/${pageId}${query}`);
  }

  async createPage(input: PageCreateInput): Promise<Page> {
    return this.request<Page>('/pages', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updatePage(pageId: string, input: PageUpdateInput): Promise<Page> {
    return this.request<Page>(`/pages/${pageId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deletePage(pageId: string, purge = false): Promise<void> {
    const query = purge ? '?purge=true' : '';
    await this.request<void>(`/pages/${pageId}${query}`, {
      method: 'DELETE',
    });
  }

  async getPagesBySpaceId(spaceId: string, params?: PaginationParams & { status?: string; bodyFormat?: BodyFormat }): Promise<PaginatedResponse<Page>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Page>>(`/spaces/${spaceId}/pages${query}`);
  }

  async getPageChildren(pageId: string, params?: PaginationParams): Promise<PaginatedResponse<Child>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Child>>(`/pages/${pageId}/children${query}`);
  }

  async getPageAncestors(pageId: string): Promise<Ancestor[]> {
    const response = await this.request<{ results: Ancestor[] }>(`/pages/${pageId}/ancestors`);
    return response.results;
  }

  async getPageDescendants(pageId: string, params?: PaginationParams): Promise<PaginatedResponse<Page>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Page>>(`/pages/${pageId}/descendants${query}`);
  }

  // ===========================================================================
  // Page Labels
  // ===========================================================================

  async getPageLabels(pageId: string, params?: PaginationParams & { prefix?: string }): Promise<PaginatedResponse<Label>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Label>>(`/pages/${pageId}/labels${query}`);
  }

  async addPageLabels(pageId: string, labels: LabelInput[]): Promise<Label[]> {
    const response = await this.request<{ results: Label[] }>(`/pages/${pageId}/labels`, {
      method: 'POST',
      body: JSON.stringify(labels),
    });
    return response.results;
  }

  async removePageLabel(pageId: string, labelId: string): Promise<void> {
    await this.request<void>(`/pages/${pageId}/labels/${labelId}`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // Page Likes
  // ===========================================================================

  async getPageLikes(pageId: string, params?: PaginationParams): Promise<PaginatedResponse<Like>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Like>>(`/pages/${pageId}/likes${query}`);
  }

  async likePage(pageId: string): Promise<void> {
    await this.request<void>(`/pages/${pageId}/likes`, {
      method: 'POST',
    });
  }

  async unlikePage(pageId: string): Promise<void> {
    await this.request<void>(`/pages/${pageId}/likes`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // Page Versions
  // ===========================================================================

  async getPageVersions(pageId: string, params?: PaginationParams): Promise<PaginatedResponse<Version>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Version>>(`/pages/${pageId}/versions${query}`);
  }

  async getPageVersion(pageId: string, versionNumber: number): Promise<Version> {
    return this.request<Version>(`/pages/${pageId}/versions/${versionNumber}`);
  }

  // ===========================================================================
  // Page Properties
  // ===========================================================================

  async getPageProperties(pageId: string, params?: PaginationParams): Promise<PaginatedResponse<ContentProperty>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<ContentProperty>>(`/pages/${pageId}/properties${query}`);
  }

  async getPageProperty(pageId: string, propertyKey: string): Promise<ContentProperty> {
    return this.request<ContentProperty>(`/pages/${pageId}/properties/${propertyKey}`);
  }

  async createPageProperty(pageId: string, input: ContentPropertyCreateInput): Promise<ContentProperty> {
    return this.request<ContentProperty>(`/pages/${pageId}/properties`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updatePageProperty(pageId: string, propertyKey: string, input: ContentPropertyUpdateInput): Promise<ContentProperty> {
    return this.request<ContentProperty>(`/pages/${pageId}/properties/${propertyKey}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deletePageProperty(pageId: string, propertyKey: string): Promise<void> {
    await this.request<void>(`/pages/${pageId}/properties/${propertyKey}`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // Page Attachments
  // ===========================================================================

  async getPageAttachments(pageId: string, params?: PaginationParams): Promise<PaginatedResponse<Attachment>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Attachment>>(`/pages/${pageId}/attachments${query}`);
  }

  // ===========================================================================
  // Page Comments
  // ===========================================================================

  async getPageComments(pageId: string, params?: PaginationParams & { bodyFormat?: BodyFormat }): Promise<PaginatedResponse<Comment>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Comment>>(`/pages/${pageId}/comments${query}`);
  }

  // ===========================================================================
  // Page Operations
  // ===========================================================================

  async getPageOperations(pageId: string): Promise<Operation[]> {
    const response = await this.request<{ results: Operation[] }>(`/pages/${pageId}/operations`);
    return response.results;
  }

  // ===========================================================================
  // Blog Posts
  // ===========================================================================

  async listBlogPosts(params?: PaginationParams & { spaceId?: string; status?: string; title?: string; bodyFormat?: BodyFormat }): Promise<PaginatedResponse<BlogPost>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<BlogPost>>(`/blogposts${query}`);
  }

  async getBlogPost(blogPostId: string, bodyFormat?: BodyFormat): Promise<BlogPost> {
    const query = bodyFormat ? `?body-format=${bodyFormat}` : '';
    return this.request<BlogPost>(`/blogposts/${blogPostId}${query}`);
  }

  async createBlogPost(input: BlogPostCreateInput): Promise<BlogPost> {
    return this.request<BlogPost>('/blogposts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateBlogPost(blogPostId: string, input: BlogPostUpdateInput): Promise<BlogPost> {
    return this.request<BlogPost>(`/blogposts/${blogPostId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteBlogPost(blogPostId: string, purge = false): Promise<void> {
    const query = purge ? '?purge=true' : '';
    await this.request<void>(`/blogposts/${blogPostId}${query}`, {
      method: 'DELETE',
    });
  }

  async getBlogPostsBySpaceId(spaceId: string, params?: PaginationParams & { status?: string; bodyFormat?: BodyFormat }): Promise<PaginatedResponse<BlogPost>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<BlogPost>>(`/spaces/${spaceId}/blogposts${query}`);
  }

  // ===========================================================================
  // Blog Post Labels
  // ===========================================================================

  async getBlogPostLabels(blogPostId: string, params?: PaginationParams & { prefix?: string }): Promise<PaginatedResponse<Label>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Label>>(`/blogposts/${blogPostId}/labels${query}`);
  }

  async addBlogPostLabels(blogPostId: string, labels: LabelInput[]): Promise<Label[]> {
    const response = await this.request<{ results: Label[] }>(`/blogposts/${blogPostId}/labels`, {
      method: 'POST',
      body: JSON.stringify(labels),
    });
    return response.results;
  }

  async removeBlogPostLabel(blogPostId: string, labelId: string): Promise<void> {
    await this.request<void>(`/blogposts/${blogPostId}/labels/${labelId}`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // Blog Post Versions
  // ===========================================================================

  async getBlogPostVersions(blogPostId: string, params?: PaginationParams): Promise<PaginatedResponse<Version>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Version>>(`/blogposts/${blogPostId}/versions${query}`);
  }

  // ===========================================================================
  // Blog Post Attachments
  // ===========================================================================

  async getBlogPostAttachments(blogPostId: string, params?: PaginationParams): Promise<PaginatedResponse<Attachment>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Attachment>>(`/blogposts/${blogPostId}/attachments${query}`);
  }

  // ===========================================================================
  // Blog Post Comments
  // ===========================================================================

  async getBlogPostComments(blogPostId: string, params?: PaginationParams & { bodyFormat?: BodyFormat }): Promise<PaginatedResponse<Comment>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Comment>>(`/blogposts/${blogPostId}/comments${query}`);
  }

  // ===========================================================================
  // Comments
  // ===========================================================================

  async listComments(params?: PaginationParams & { bodyFormat?: BodyFormat }): Promise<PaginatedResponse<Comment>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Comment>>(`/comments${query}`);
  }

  async getComment(commentId: string, bodyFormat?: BodyFormat): Promise<Comment> {
    const query = bodyFormat ? `?body-format=${bodyFormat}` : '';
    return this.request<Comment>(`/comments/${commentId}${query}`);
  }

  async createComment(input: CommentCreateInput): Promise<Comment> {
    return this.request<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateComment(commentId: string, input: CommentUpdateInput): Promise<Comment> {
    return this.request<Comment>(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.request<void>(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // Attachments
  // ===========================================================================

  async listAttachments(params?: PaginationParams & { status?: string; mediaType?: string; filename?: string }): Promise<PaginatedResponse<Attachment>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Attachment>>(`/attachments${query}`);
  }

  async getAttachment(attachmentId: string): Promise<Attachment> {
    return this.request<Attachment>(`/attachments/${attachmentId}`);
  }

  async deleteAttachment(attachmentId: string, purge = false): Promise<void> {
    const query = purge ? '?purge=true' : '';
    await this.request<void>(`/attachments/${attachmentId}${query}`, {
      method: 'DELETE',
    });
  }

  async getAttachmentLabels(attachmentId: string, params?: PaginationParams): Promise<PaginatedResponse<Label>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Label>>(`/attachments/${attachmentId}/labels${query}`);
  }

  // ===========================================================================
  // Labels
  // ===========================================================================

  async listLabels(params?: PaginationParams & { prefix?: string }): Promise<PaginatedResponse<Label>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Label>>(`/labels${query}`);
  }

  async getLabel(labelId: string): Promise<Label> {
    return this.request<Label>(`/labels/${labelId}`);
  }

  async getLabelPages(labelId: string, params?: PaginationParams & { bodyFormat?: BodyFormat }): Promise<PaginatedResponse<Page>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Page>>(`/labels/${labelId}/pages${query}`);
  }

  async getLabelBlogPosts(labelId: string, params?: PaginationParams & { bodyFormat?: BodyFormat }): Promise<PaginatedResponse<BlogPost>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<BlogPost>>(`/labels/${labelId}/blogposts${query}`);
  }

  // ===========================================================================
  // Tasks
  // ===========================================================================

  async listTasks(params?: PaginationParams & { spaceId?: string; pageId?: string; status?: string }): Promise<PaginatedResponse<Task>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Task>>(`/tasks${query}`);
  }

  async getTask(taskId: string): Promise<Task> {
    return this.request<Task>(`/tasks/${taskId}`);
  }

  async updateTask(taskId: string, input: TaskUpdateInput): Promise<Task> {
    return this.request<Task>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  // ===========================================================================
  // Users
  // ===========================================================================

  async listUsers(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<User>>(`/users${query}`);
  }

  async getUser(accountId: string): Promise<User> {
    return this.request<User>(`/users/${accountId}`);
  }

  // ===========================================================================
  // Custom Content
  // ===========================================================================

  async listCustomContent(params?: PaginationParams & { type?: string; spaceId?: string }): Promise<PaginatedResponse<CustomContent>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<CustomContent>>(`/custom-content${query}`);
  }

  async getCustomContent(customContentId: string, bodyFormat?: BodyFormat): Promise<CustomContent> {
    const query = bodyFormat ? `?body-format=${bodyFormat}` : '';
    return this.request<CustomContent>(`/custom-content/${customContentId}${query}`);
  }

  async createCustomContent(input: CustomContentCreateInput): Promise<CustomContent> {
    return this.request<CustomContent>('/custom-content', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateCustomContent(customContentId: string, input: CustomContentUpdateInput): Promise<CustomContent> {
    return this.request<CustomContent>(`/custom-content/${customContentId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteCustomContent(customContentId: string, purge = false): Promise<void> {
    const query = purge ? '?purge=true' : '';
    await this.request<void>(`/custom-content/${customContentId}${query}`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // Space Permissions
  // ===========================================================================

  async getSpacePermissions(spaceId: string, params?: PaginationParams): Promise<PaginatedResponse<SpacePermission>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<SpacePermission>>(`/spaces/${spaceId}/permissions${query}`);
  }

  async createSpacePermission(spaceId: string, input: SpacePermissionCreateInput): Promise<SpacePermission> {
    return this.request<SpacePermission>(`/spaces/${spaceId}/permissions`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async deleteSpacePermission(spaceId: string, permissionId: string): Promise<void> {
    await this.request<void>(`/spaces/${spaceId}/permissions/${permissionId}`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // Space Properties
  // ===========================================================================

  async getSpaceProperties(spaceId: string, params?: PaginationParams): Promise<PaginatedResponse<SpaceProperty>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<SpaceProperty>>(`/spaces/${spaceId}/properties${query}`);
  }

  async getSpaceProperty(spaceId: string, propertyKey: string): Promise<SpaceProperty> {
    return this.request<SpaceProperty>(`/spaces/${spaceId}/properties/${propertyKey}`);
  }

  async createSpaceProperty(spaceId: string, input: SpacePropertyCreateInput): Promise<SpaceProperty> {
    return this.request<SpaceProperty>(`/spaces/${spaceId}/properties`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateSpaceProperty(spaceId: string, propertyKey: string, input: SpacePropertyUpdateInput): Promise<SpaceProperty> {
    return this.request<SpaceProperty>(`/spaces/${spaceId}/properties/${propertyKey}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteSpaceProperty(spaceId: string, propertyKey: string): Promise<void> {
    await this.request<void>(`/spaces/${spaceId}/properties/${propertyKey}`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // Databases
  // ===========================================================================

  async listDatabases(params?: PaginationParams & { spaceId?: string }): Promise<PaginatedResponse<Database>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Database>>(`/databases${query}`);
  }

  async getDatabase(databaseId: string): Promise<Database> {
    return this.request<Database>(`/databases/${databaseId}`);
  }

  // ===========================================================================
  // Folders
  // ===========================================================================

  async listFolders(params?: PaginationParams & { spaceId?: string }): Promise<PaginatedResponse<Folder>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Folder>>(`/folders${query}`);
  }

  async getFolder(folderId: string): Promise<Folder> {
    return this.request<Folder>(`/folders/${folderId}`);
  }

  // ===========================================================================
  // Whiteboards
  // ===========================================================================

  async listWhiteboards(params?: PaginationParams & { spaceId?: string }): Promise<PaginatedResponse<Whiteboard>> {
    const query = this.buildQueryString(params || {});
    return this.request<PaginatedResponse<Whiteboard>>(`/whiteboards${query}`);
  }

  async getWhiteboard(whiteboardId: string): Promise<Whiteboard> {
    return this.request<Whiteboard>(`/whiteboards/${whiteboardId}`);
  }

  // ===========================================================================
  // Search (v1 API - CQL)
  // ===========================================================================

  async search(cql: string, params?: PaginationParams & { excerpt?: boolean }): Promise<PaginatedResponse<SearchResult>> {
    const searchParams = new URLSearchParams();
    searchParams.set('cql', cql);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.excerpt !== undefined) searchParams.set('excerpt', String(params.excerpt));

    return this.request<PaginatedResponse<SearchResult>>(`/search?${searchParams.toString()}`, {}, true);
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a Confluence client instance with tenant-specific credentials.
 *
 * MULTI-TENANT: Each request provides its own credentials via headers,
 * allowing a single server deployment to serve multiple tenants.
 *
 * @param credentials - Tenant credentials parsed from request headers
 */
export function createConfluenceClient(credentials: TenantCredentials): ConfluenceClient {
  return new ConfluenceClientImpl(credentials);
}
