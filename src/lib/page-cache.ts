import { useState, useRef, useCallback } from 'react';

// In-memory cache per key with optional TTL. Survives navigations within the same SPA session.
type Entry = { value: unknown; expiresAt: number };
const cache = new Map<string, Entry>();

const DEFAULT_TTL_MS = 60_000; // 60s — fresh enough to feel instant, short enough to stay current.

function read(key: string): unknown | undefined {
  const e = cache.get(key);
  if (!e) return undefined;
  if (e.expiresAt !== 0 && e.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return e.value;
}

export function getCached<T>(key: string): T | undefined {
  return read(key) as T | undefined;
}

export function setCached<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
  const expiresAt = ttlMs <= 0 ? 0 : Date.now() + ttlMs;
  cache.set(key, { value, expiresAt });
}

export function clearCached(key: string): void {
  cache.delete(key);
}

export function clearAllCached(): void {
  cache.clear();
}

/** Invalidate every cached key starting with the given prefix. */
export function invalidateByPrefix(prefix: string): void {
  for (const k of Array.from(cache.keys())) {
    if (k.startsWith(prefix)) cache.delete(k);
  }
}

/**
 * useState that persists across unmounts via an in-memory cache key.
 * On first render, hydrates from cache (if present and not expired), otherwise from `initial`.
 * Setter writes to React state and cache, so the previous value appears immediately on
 * remount while any background fetch refreshes it.
 */
export function useCachedState<T>(
  key: string,
  initial: T,
  ttlMs: number = DEFAULT_TTL_MS,
): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    const c = read(key);
    return (c === undefined ? initial : c) as T;
  });
  const keyRef = useRef(key);
  keyRef.current = key;
  const ttlRef = useRef(ttlMs);
  ttlRef.current = ttlMs;

  const set = useCallback((v: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      setCached(keyRef.current, next, ttlRef.current);
      return next;
    });
  }, []);

  return [state, set];
}
