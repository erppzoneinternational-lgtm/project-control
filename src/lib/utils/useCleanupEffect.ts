import { useEffect } from 'react';

export function useCleanupEffect(
  effect: (isCancelled: () => boolean) => Promise<void> | void,
  deps: React.DependencyList
): void {
  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;

    effect(isCancelled);

    return () => {
      cancelled = true;
    };
  }, deps);
}
