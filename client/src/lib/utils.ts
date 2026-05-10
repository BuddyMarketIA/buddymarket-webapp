import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Verifica si un usuario tiene un rol determinado.
 * Soporta roles múltiples: comprueba `role` principal y `secondaryRoles`.
 */
export function hasRole(user: { role?: string | null; secondaryRoles?: string[] | null } | null | undefined, roleToCheck: string): boolean {
  if (!user) return false;
  if (user.role === roleToCheck) return true;
  if (user.secondaryRoles && user.secondaryRoles.includes(roleToCheck)) return true;
  return false;
}
