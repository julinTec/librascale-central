import { useState, useRef, useCallback } from 'react';

// Simple in-memory cache per key. Survives navigations within the same SPA session.
const cache = new Map<string, unknown>();

export function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCached<T>(key: string, value: T): void {
  cache.set(key, value);
}

export function clearCached(key: string): void {
  cache.delete(key);
}

export function clearAllCached(): void {
  cache.clear();
}

/**
 * useState that persists across unmounts via an in-memory cache key.
 * On first render, hydrates from cache (if present), otherwise from `initial`.
 * Setter writes both to React state and cache, so when the component remounts
 * the previous value appears immediately while a fresh fetch runs in background.
 */
export function useCachedState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    const c = cache.get(key);
    return (c === undefined ? initial : c) as T;
  });
  const keyRef = useRef(key);
  keyRef.current = key;

  const set = useCallback((v: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      cache.set(keyRef.current, next);
      return next;
    });
  }, []);

  return [state, set];
}
