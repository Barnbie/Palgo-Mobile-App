import { useSyncExternalStore } from 'react';

// The phone's latest position while a Pal is sharing it. A tiny shared store so the
// Pal's screen can show distance without asking the GPS a second time.
let latest = null;
const listeners = new Set();

export function setLatestPosition(position) {
  latest = position;
  listeners.forEach((listener) => listener());
}

export function useLatestPosition() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => latest,
  );
}
