/**
 * Shared session-init promise.
 *
 * App.tsx starts a /auth/refresh call on mount and registers it here.
 * The Axios interceptor checks this before doing its own refresh, so both
 * never run concurrently and rotate the same refresh token twice.
 */
let _initPromise: Promise<void> | null = null;

export function setInitPromise(p: Promise<void>): void {
  _initPromise = p;
}

export function getInitPromise(): Promise<void> | null {
  return _initPromise;
}
