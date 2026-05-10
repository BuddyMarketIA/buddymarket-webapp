/**
 * Utility functions for handling tRPC/API errors in the frontend.
 * 
 * The "Please login (10001)" message appears when:
 * - The server cold-starts and the session cookie hasn't been validated yet
 * - The session has expired (rare, 1-year cookie)
 * 
 * We should NEVER show this raw message to users — it's confusing.
 * Instead, we silently ignore it or show a generic "session" message.
 */

const AUTH_ERROR_PATTERNS = [
  '10001', '10002', '10003',
  'Please login',
  'UNAUTHORIZED',
  'Invalid session',
  'Session invalid',
];

/**
 * Returns true if the error is an authentication/authorization error.
 * These should not be shown as toast errors to users.
 */
export function isAuthError(err: unknown): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : (err as any)?.message ?? '';
  return AUTH_ERROR_PATTERNS.some(p => msg.includes(p));
}

/**
 * Returns a user-friendly error message, filtering out auth errors.
 * Use this in onError handlers instead of showing err.message directly.
 * 
 * @param err - The error from tRPC
 * @param fallback - Fallback message if err.message is empty or an auth error
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (isAuthError(err)) return fallback; // Don't show auth errors
  const msg = typeof err === 'string' ? err : (err as any)?.message ?? '';
  return msg || fallback;
}
