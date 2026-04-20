export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
export const INVALID_SESSION_MSG = 'Session invalid, please login again (10003)';

/**
 * Verifica si un usuario tiene un rol determinado.
 * Soporta roles múltiples: comprueba tanto el campo `role` principal
 * como el array `secondaryRoles`.
 * Uso: hasRole(user, "admin"), hasRole(user, "buddyexpert")
 */
export function hasRole(user: { role: string; secondaryRoles?: string[] | null }, roleToCheck: string): boolean {
  if (user.role === roleToCheck) return true;
  if (user.secondaryRoles && user.secondaryRoles.includes(roleToCheck)) return true;
  return false;
}
