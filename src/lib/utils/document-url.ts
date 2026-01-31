/**
 * Document URL Utilities
 *
 * Provides helper functions to generate secure document URLs
 * that work properly with Cloudflare tunnel and other proxies
 */

/**
 * Get the secure download URL for a document by ID
 * Uses the authenticated API route instead of direct static file access
 */
export function getDocumentDownloadUrl(documentId: string): string {
  return `/api/documents/${documentId}/download`;
}

/**
 * Get the preview URL for a document (for images)
 * Uses the same authenticated route
 */
export function getDocumentPreviewUrl(documentId: string): string {
  return `/api/documents/${documentId}/download`;
}

/**
 * Check if a file path is a static file reference
 */
export function isStaticFilePath(path: string): boolean {
  return path.startsWith('/documents/') || path.startsWith('/uploads/');
}

/**
 * Convert a static file path to use the secure download API
 * This is a temporary helper until all components are updated
 */
export async function convertFilePathToDownloadUrl(
  filePath: string,
  _clientId?: string
): Promise<string> {
  // If it's already an API URL, return as-is
  if (filePath.startsWith('/api/')) {
    return filePath;
  }

  // If it's a static file path, we need to find the document ID
  // This requires a database lookup, so for now return the filePath
  // and let the API route handle it
  return filePath;
}
