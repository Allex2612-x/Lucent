import { useEffect, useRef, useState } from 'react';
import { categoriesService, CategorySuggestion } from '../services/categories.service';

/**
 * Debounce-then-fetch hook that asks the backend for the best-guess category
 * for a free-text description. The suggestion is suppressed while the user is
 * still typing and cleared when the description is empty.
 */
export function useCategorySuggestion(
  description: string,
  type: 'income' | 'expense',
  options?: { debounceMs?: number; enabled?: boolean },
) {
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null);
  const requestIdRef = useRef(0);

  const enabled = options?.enabled !== false;
  const debounceMs = options?.debounceMs ?? 350;

  useEffect(() => {
    if (!enabled || !description || description.trim().length < 3) {
      setSuggestion(null);
      return;
    }
    const currentId = ++requestIdRef.current;
    const handle = window.setTimeout(async () => {
      try {
        const res = await categoriesService.suggest(description, type);
        if (currentId !== requestIdRef.current) return;
        setSuggestion(res.data?.data ?? null);
      } catch {
        if (currentId !== requestIdRef.current) return;
        setSuggestion(null);
      }
    }, debounceMs);
    return () => window.clearTimeout(handle);
  }, [description, type, debounceMs, enabled]);

  return suggestion;
}
