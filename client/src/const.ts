export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Ruta de login propia de la app (OTP por email + Google + Apple) */
export const getLoginUrl = (_returnPath?: string): string => "/login";

/** Alias para compatibilidad — todos redirigen a /login */
export const getSignUpUrl = (): string => "/login";
export const getGoogleLoginUrl = (): string => "/login";
export const getGoogleSignUpUrl = (): string => "/login";
