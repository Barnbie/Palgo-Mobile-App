import { useEffect, useState } from 'react';
import { getUnreadMessageCount } from '../lib/api/chat';

const POLL_MS = 6000;

/** How many messages from the other person on this errand you have not read yet. */
export function useUnreadMessages(errandId, role, enabled = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!errandId || !role || !enabled) {
      setCount(0);
      return undefined;
    }
    let alive = true;
    const load = () =>
      getUnreadMessageCount(errandId, role)
        .then((value) => alive && setCount(value))
        .catch(() => {});
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [errandId, role, enabled]);
  return count;
}
