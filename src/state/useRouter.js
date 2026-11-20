import { useCallback, useRef, useState } from 'react';

/**
 * Tiny screen router: the current screen is a string id, and `go` switches it.
 * `screenRef` always holds the latest id so async code can read it safely.
 */
export function useRouter(initialScreen = 'splash') {
  const [screen, setScreen] = useState(initialScreen);
  const screenRef = useRef(initialScreen);

  const go = useCallback((target) => {
    screenRef.current = target;
    setScreen(target);
  }, []);

  return { screen, screenRef, go };
}
