import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useRef } from "react";

// localStorage key used to persist authentication state across page reloads.
// This prevents the brief window where hasEverAuthenticated.current is false
// (before the first meQuery response) from triggering an unwanted redirect.
const AUTH_STATE_KEY = "bm_auth_state";

function getPersistedAuthState(): boolean {
  try {
    return localStorage.getItem(AUTH_STATE_KEY) === "authenticated";
  } catch {
    return false;
  }
}

function setPersistedAuthState(authenticated: boolean): void {
  try {
    if (authenticated) {
      localStorage.setItem(AUTH_STATE_KEY, "authenticated");
    } else {
      localStorage.removeItem(AUTH_STATE_KEY);
    }
  } catch {
    // localStorage might be unavailable in some environments
  }
}

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};
  const utils = trpc.useUtils();

  // Track whether we have EVER successfully authenticated in this session.
  // Initialized from localStorage so it survives page reloads.
  // This prevents transient errors (network blips, server cold-start) from
  // kicking the user out after they are already logged in.
  const hasEverAuthenticated = useRef(getPersistedAuthState());

  const meQuery = trpc.auth.me.useQuery(undefined, {
    // Never retry auth.me — a real 401 should not be retried.
    retry: false,
    // Do NOT refetch when the window regains focus — this was causing
    // the query to fire again after the tab was backgrounded and then
    // resumed, and a transient error would log the user out.
    refetchOnWindowFocus: false,
    // Do NOT refetch when the network reconnects — a transient error
    // during reconnection would log the user out.
    refetchOnReconnect: false,
    // Do NOT refetch on mount if we already have data — prevents unnecessary
    // re-verification when navigating between pages.
    refetchOnMount: false,
    // Keep the cached data for 1 hour. The cookie (1-year expiry) is the
    // source of truth — we do NOT need to re-verify every 10 minutes.
    // Frequent refetches were causing transient 401s to log the user out.
    staleTime: 60 * 60 * 1000, // 1 hour
    // Keep the data in cache for 2 hours even when the component unmounts.
    gcTime: 2 * 60 * 60 * 1000,
  });

  // Once we get a valid user, mark that we have authenticated in both the ref
  // and localStorage so it persists across page reloads.
  useEffect(() => {
    if (meQuery.data) {
      hasEverAuthenticated.current = true;
      setPersistedAuthState(true);
    }
  }, [meQuery.data]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      // If already unauthorized, treat as successful logout
      if (
        !(
          error instanceof TRPCClientError &&
          error.data?.code === "UNAUTHORIZED"
        )
      ) {
        console.error("[logout] unexpected error:", error);
      }
    } finally {
      // Clear all tRPC cache
      utils.auth.me.setData(undefined, null);
      await utils.invalidate();

      // Clear the session cookie from the client side
      const cookieName = "app_session_id";
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=None; Secure`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;

      // Reset the "has ever authenticated" flag so the redirect logic works
      // correctly on the next login.
      hasEverAuthenticated.current = false;
      setPersistedAuthState(false);

      // Set localStorage flag so LoginPage never auto-redirects after logout.
      localStorage.setItem("bm_just_logged_out", "1");

      // Force a full page reload to /login to clear ALL React state and tRPC cache
      window.location.replace("/login");
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    // isAuthenticated is true if:
    // 1. We have current data from the server, OR
    // 2. We have previously authenticated AND the query is not in a definitive
    //    error state (i.e., it's just loading/stale, not a real 401).
    //
    // This prevents transient network errors from flipping isAuthenticated to
    // false and triggering an unwanted redirect.
    const hasData = Boolean(meQuery.data);
    const isDefinitiveError =
      meQuery.isError &&
      meQuery.error instanceof TRPCClientError &&
      (meQuery.error.data?.code === "UNAUTHORIZED" ||
        meQuery.error.data?.httpStatus === 401);

    // Check both the ref (current session) and localStorage (persisted across reloads)
    const wasAuthenticated = hasEverAuthenticated.current || getPersistedAuthState();

    const isAuthenticated =
      hasData ||
      (wasAuthenticated && !isDefinitiveError);

    return {
      user: meQuery.data ?? null,
      // Use isPending instead of isLoading so loading=true covers the initial
      // state before the first query fires (not just when actively fetching).
      loading: meQuery.isPending || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated,
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isError,
    meQuery.isPending,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isPending || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    // Only redirect if we have a definitive error (real 401), not a transient one.
    const isDefinitiveError =
      meQuery.isError &&
      meQuery.error instanceof TRPCClientError &&
      (meQuery.error.data?.code === "UNAUTHORIZED" ||
        meQuery.error.data?.httpStatus === 401);
    const wasAuthenticated = hasEverAuthenticated.current || getPersistedAuthState();
    if (!isDefinitiveError && wasAuthenticated) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isPending,
    meQuery.isError,
    meQuery.error,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
