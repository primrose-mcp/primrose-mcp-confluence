/**
 * Confluence Entity Types
 *
 * Type definitions for Confluence REST API v2 entities.
 */

// =============================================================================
// Pagination
// =============================================================================

export interface PaginationParams {
  /** Number of items to return (1-250) */
  limit?: number;
  /** Cursor for pagination */
  cursor?: string;
}

export interface PaginatedResponse<T> {
  /** Array of items */
  results: T[];
  /** Links for pagination */
  _links?: {
    next?: string;
    base?: string;
  };
}

// =============================================================================
// Body Format
// =============================================================================

export type BodyFormat = 'storage' | 'atlas_doc_format' | 'view' | 'editor' | 'wiki';

export interface ContentBody {
  /** Body representation (storage format) */
  storage?: {
    value: string;
    representation: 'storage';
  };
  /** Body representation (atlas doc format) */
  atlas_doc_format?: {
    value: string;
    representation: 'atlas_doc_format';
  };
  /** Body representation (view format) */
  view?: {
    value: string;
    representation: 'view';
  };
}

// =============================================================================
// Space
// =============================================================================

export interface Space {
  id: string;
  key: string;
  name: string;
  type: 'global' | 'personal';
  status: 'current' | 'archived';
  description?: {
    plain?: { value: string };
    view?: { value: string };
  };
  homepageId?: string;
  createdAt?: string;
  authorId?: string;
  icon?: {
    path: string;
    apiDownloadLink: string;
  };
  _links?: {
    webui?: string;
  };
}

export interface SpaceCreateInput {
  key: string;
  name: string;
  description?: {
    plain?: { value: string };
  };
  type?: 'global' | 'personal';
}

// =============================================================================
// Page
// =============================================================================

export interface Page {
  id: string;
  status: 'current' | 'trashed' | 'draft' | 'archived';
  title: string;
  spaceId: string;
  parentId?: string;
  parentType?: 'page' | 'whiteboard' | 'database' | 'folder';
  position?: number;
  authorId?: string;
  ownerId?: string;
  lastOwnerId?: string;
  createdAt?: string;
  version?: {
    number: number;
    message?: string;
    minorEdit?: boolean;
    authorId?: string;
    createdAt?: string;
  };
  body?: ContentBody;
  _links?: {
    webui?: string;
    editui?: string;
    tinyui?: string;
  };
}

export interface PageCreateInput {
  spaceId: string;
  status?: 'current' | 'draft';
  title: string;
  parentId?: string;
  body?: {
    representation: 'storage' | 'atlas_doc_format' | 'wiki';
    value: string;
  };
}

export interface PageUpdateInput {
  id: string;
  status?: 'current' | 'draft';
  title: string;
  body?: {
    representation: 'storage' | 'atlas_doc_format' | 'wiki';
    value: string;
  };
  version: {
    number: number;
    message?: string;
  };
}

// =============================================================================
// Blog Post
// =============================================================================

export interface BlogPost {
  id: string;
  status: 'current' | 'trashed' | 'draft' | 'archived';
  title: string;
  spaceId: string;
  authorId?: string;
  createdAt?: string;
  version?: {
    number: number;
    message?: string;
    minorEdit?: boolean;
    authorId?: string;
    createdAt?: string;
  };
  body?: ContentBody;
  _links?: {
    webui?: string;
    editui?: string;
    tinyui?: string;
  };
}

export interface BlogPostCreateInput {
  spaceId: string;
  status?: 'current' | 'draft';
  title: string;
  body?: {
    representation: 'storage' | 'atlas_doc_format' | 'wiki';
    value: string;
  };
}

export interface BlogPostUpdateInput {
  id: string;
  status?: 'current' | 'draft';
  title: string;
  body?: {
    representation: 'storage' | 'atlas_doc_format' | 'wiki';
    value: string;
  };
  version: {
    number: number;
    message?: string;
  };
}

// =============================================================================
// Attachment
// =============================================================================

export interface Attachment {
  id: string;
  status: 'current' | 'trashed' | 'archived';
  title: string;
  fileId?: string;
  fileSize?: number;
  mediaType?: string;
  mediaTypeDescription?: string;
  comment?: string;
  pageId?: string;
  blogPostId?: string;
  customContentId?: string;
  version?: {
    number: number;
    createdAt?: string;
  };
  downloadLink?: string;
  _links?: {
    webui?: string;
    download?: string;
  };
}

// =============================================================================
// Comment
// =============================================================================

export interface Comment {
  id: string;
  status: 'current' | 'trashed';
  title?: string;
  pageId?: string;
  blogPostId?: string;
  customContentId?: string;
  parentCommentId?: string;
  version?: {
    number: number;
    message?: string;
    minorEdit?: boolean;
    authorId?: string;
    createdAt?: string;
  };
  body?: ContentBody;
  createdAt?: string;
  _links?: {
    webui?: string;
  };
}

export interface CommentCreateInput {
  pageId?: string;
  blogPostId?: string;
  parentCommentId?: string;
  body: {
    representation: 'storage' | 'atlas_doc_format' | 'wiki';
    value: string;
  };
}

export interface CommentUpdateInput {
  body: {
    representation: 'storage' | 'atlas_doc_format' | 'wiki';
    value: string;
  };
  version: {
    number: number;
    message?: string;
  };
}

// =============================================================================
// Label
// =============================================================================

export interface Label {
  id: string;
  name: string;
  prefix: 'global' | 'my' | 'team' | 'system';
}

export interface LabelInput {
  name: string;
  prefix?: 'global' | 'my' | 'team';
}

// =============================================================================
// Task
// =============================================================================

export interface Task {
  id: string;
  localId?: string;
  spaceId?: string;
  pageId?: string;
  blogPostId?: string;
  status: 'incomplete' | 'complete';
  body?: ContentBody;
  createdBy?: string;
  assignedTo?: string;
  completedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  dueAt?: string;
  completedAt?: string;
}

export interface TaskUpdateInput {
  status?: 'incomplete' | 'complete';
}

// =============================================================================
// User
// =============================================================================

export interface User {
  accountId: string;
  accountType: 'atlassian' | 'app' | 'customer';
  email?: string;
  publicName?: string;
  displayName?: string;
  profilePicture?: {
    path: string;
    width: number;
    height: number;
    isDefault: boolean;
  };
  isExternalCollaborator?: boolean;
}

// =============================================================================
// Version
// =============================================================================

export interface Version {
  number: number;
  message?: string;
  minorEdit?: boolean;
  authorId?: string;
  createdAt?: string;
}

// =============================================================================
// Content Property
// =============================================================================

export interface ContentProperty {
  id: string;
  key: string;
  value: unknown;
  version?: {
    number: number;
    message?: string;
    minorEdit?: boolean;
    authorId?: string;
    createdAt?: string;
  };
}

export interface ContentPropertyCreateInput {
  key: string;
  value: unknown;
}

export interface ContentPropertyUpdateInput {
  key: string;
  value: unknown;
  version: {
    number: number;
    message?: string;
  };
}

// =============================================================================
// Space Permission
// =============================================================================

export interface SpacePermission {
  id: string;
  principal: {
    type: 'user' | 'group';
    id: string;
  };
  operation: {
    key: string;
    target: string;
  };
}

export interface SpacePermissionCreateInput {
  principal: {
    type: 'user' | 'group';
    id: string;
  };
  operation: {
    key: string;
    target: string;
  };
}

// =============================================================================
// Space Property
// =============================================================================

export interface SpaceProperty {
  id: string;
  key: string;
  value: unknown;
  createdAt?: string;
  createdBy?: string;
  version?: {
    number: number;
    message?: string;
    minorEdit?: boolean;
    authorId?: string;
    createdAt?: string;
  };
}

export interface SpacePropertyCreateInput {
  key: string;
  value: unknown;
}

export interface SpacePropertyUpdateInput {
  value: unknown;
  version: {
    number: number;
    message?: string;
  };
}

// =============================================================================
// Custom Content
// =============================================================================

export interface CustomContent {
  id: string;
  type: string;
  status: 'current' | 'trashed' | 'draft' | 'archived';
  title?: string;
  spaceId?: string;
  pageId?: string;
  blogPostId?: string;
  customContentId?: string;
  body?: ContentBody;
  version?: Version;
  createdAt?: string;
  _links?: {
    webui?: string;
  };
}

export interface CustomContentCreateInput {
  type: string;
  status?: 'current' | 'draft';
  title?: string;
  spaceId?: string;
  pageId?: string;
  blogPostId?: string;
  customContentId?: string;
  body?: {
    representation: 'storage' | 'atlas_doc_format' | 'wiki';
    value: string;
  };
}

export interface CustomContentUpdateInput {
  id: string;
  status?: 'current' | 'draft';
  title?: string;
  body?: {
    representation: 'storage' | 'atlas_doc_format' | 'wiki';
    value: string;
  };
  version: {
    number: number;
    message?: string;
  };
}

// =============================================================================
// Database (Confluence Database)
// =============================================================================

export interface Database {
  id: string;
  title: string;
  status: 'current' | 'trashed' | 'draft' | 'archived';
  spaceId: string;
  parentId?: string;
  parentType?: 'page' | 'whiteboard' | 'database' | 'folder';
  authorId?: string;
  ownerId?: string;
  createdAt?: string;
  _links?: {
    webui?: string;
    editui?: string;
  };
}

// =============================================================================
// Folder
// =============================================================================

export interface Folder {
  id: string;
  title: string;
  status: 'current' | 'trashed' | 'archived';
  spaceId: string;
  parentId?: string;
  parentType?: 'page' | 'whiteboard' | 'database' | 'folder';
  position?: number;
  authorId?: string;
  createdAt?: string;
  _links?: {
    webui?: string;
  };
}

// =============================================================================
// Whiteboard
// =============================================================================

export interface Whiteboard {
  id: string;
  title: string;
  status: 'current' | 'trashed' | 'archived';
  spaceId: string;
  parentId?: string;
  parentType?: 'page' | 'whiteboard' | 'database' | 'folder';
  position?: number;
  authorId?: string;
  ownerId?: string;
  createdAt?: string;
  _links?: {
    webui?: string;
    editui?: string;
  };
}

// =============================================================================
// Ancestor
// =============================================================================

export interface Ancestor {
  id: string;
  type: 'page' | 'whiteboard' | 'database' | 'folder' | 'space';
  title?: string;
}

// =============================================================================
// Child
// =============================================================================

export interface Child {
  id: string;
  type: 'page' | 'whiteboard' | 'database' | 'folder' | 'custom-content' | 'attachment' | 'comment';
  status?: string;
  title?: string;
  childPosition?: number;
}

// =============================================================================
// Search Result (v1 API)
// =============================================================================

export interface SearchResult {
  content?: {
    id: string;
    type: string;
    status: string;
    title: string;
    space?: {
      id: number;
      key: string;
      name: string;
    };
    _links?: {
      webui?: string;
    };
  };
  title?: string;
  excerpt?: string;
  url?: string;
  resultGlobalContainer?: {
    title: string;
    displayUrl: string;
  };
  lastModified?: string;
  friendlyLastModified?: string;
}

// =============================================================================
// Like
// =============================================================================

export interface Like {
  accountId: string;
}

// =============================================================================
// Operation
// =============================================================================

export interface Operation {
  operation: string;
  targetType: string;
}

// =============================================================================
// Response Format
// =============================================================================

export type ResponseFormat = 'json' | 'markdown';
