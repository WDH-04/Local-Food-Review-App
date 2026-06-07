import { useCallback } from "react";

/**
 * Wraps `localStorage` with try/catch + an optional per-user namespace.
 *
 * Why two flavors?
 * - `localGet/Set/Remove` are user-scoped: keys are suffixed with the active
 *   user's email (e.g. `applications:alice@example.com`) so two users on the
 *   same browser don't see each other's data.
 * - `globalGet/Set/Remove` are unscoped: used for data that is intentionally
 *   shared across all users on the device (e.g. business products created
 *   locally before backend sync).
 *
 * All access is wrapped in try/catch because `localStorage` can throw in
 * private mode, when quota is exceeded, or when storage is disabled.
 */
export function useLocalStorage(activeEmail?: string | null) {
  const buildKey = useCallback(
    (key: string, emailOverride?: string | null) => {
      const id = (emailOverride ?? activeEmail ?? "").trim();
      return id ? `${key}:${id}` : key;
    },
    [activeEmail]
  );

  // ---- user-scoped ----
  const localGet = useCallback(
    (key: string, emailOverride?: string | null) => {
      try {
        return localStorage.getItem(buildKey(key, emailOverride));
      } catch {
        return null;
      }
    },
    [buildKey]
  );

  const localSet = useCallback(
    (key: string, value: string, emailOverride?: string | null) => {
      try {
        localStorage.setItem(buildKey(key, emailOverride), value);
      } catch {
        /* storage unavailable / quota exceeded — drop the write */
      }
    },
    [buildKey]
  );

  const localRemove = useCallback(
    (key: string, emailOverride?: string | null) => {
      try {
        localStorage.removeItem(buildKey(key, emailOverride));
      } catch {
        /* ignore */
      }
    },
    [buildKey]
  );

  // ---- global (not user-scoped) ----
  const globalGet = useCallback((key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }, []);

  const globalSet = useCallback((key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  }, []);

  const globalRemove = useCallback((key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, []);

  return {
    localGet,
    localSet,
    localRemove,
    globalGet,
    globalSet,
    globalRemove,
  };
}
