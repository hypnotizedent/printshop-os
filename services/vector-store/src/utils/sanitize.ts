/**
 * Input sanitization utilities for Milvus filter expressions
 */

/**
 * Escape special characters in filter values to prevent injection attacks.
 * This escapes quotes and backslashes that could break filter syntax.
 */
export function escapeFilterValue(value: string): string {
  return value.replace(/["\\]/g, '\\$&');
}
