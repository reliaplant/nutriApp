'use client'

import { useEffect, useState } from 'react';

/**
 * Persiste la última vista (kanban/list/table/etc.) en localStorage por página.
 * SSR-safe: en el primer render usa el default y luego rehidrata desde storage.
 */
export function usePersistedView<T extends string>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  // Hydrate from localStorage after mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) setValue(stored as T);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (v: T) => {
    setValue(v);
    try { window.localStorage.setItem(key, v); } catch { /* ignore */ }
  };

  return [value, update];
}
