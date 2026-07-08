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

/**
 * Returns today's date in YYYY-MM-DD format using the user's LOCAL timezone.
 * Unlike new Date().toISOString().slice(0,10) which uses UTC,
 * this function correctly handles midnight crossovers in the user's timezone.
 * @param date Optional date to format (defaults to now)
 */
export function getLocalDateString(date?: Date): string {
  const d = date ?? new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
