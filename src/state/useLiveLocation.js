import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { geocodeAddress, watchPosition } from '../lib/currentLocation';
import { getPalLocation, sharePalLocation } from '../lib/api/liveLocation';
import { setLatestPosition } from '../lib/liveLocation';

const RUNNING = ['ACCEPTED', 'ACTIVE'];
const SEND_EVERY_MS = 7000;
const POLL_MS = 6000;

/**
 * Pal side: while the Pal has an accepted or running errand and the app is open, send the
 * phone's position so the User can see it. Stops when the errand ends.
 */
export function usePalLocationSharing({ role, authUserId, errands }) {
  const active =
    role === 'pal'
      ? errands.find((item) => item.palUserId === authUserId && RUNNING.includes(item.status))
      : null;
  const errandId = active?.id || null;
  const warned = useRef('');
  useEffect(() => {
    if (!errandId) {
      setLatestPosition(null);
      return undefined;
    }
    let cancelled = false;
    let stop = null;
    let lastSent = 0;
    watchPosition((position) => {
      setLatestPosition(position);
      const now = Date.now();
      if (now - lastSent < SEND_EVERY_MS) return;
      lastSent = now;
      sharePalLocation(errandId, position.latitude, position.longitude, position.accuracy).catch(
        () => {},
      );
    })
      .then((stopWatching) => {
        if (cancelled) stopWatching();
        else stop = stopWatching;
      })
      .catch((error) => {
        if (warned.current === errandId) return;
        warned.current = errandId;
        Alert.alert('Live location is off', error?.message || 'We could not read your location.');
      });
    return () => {
      cancelled = true;
      if (stop) stop();
    };
  }, [errandId]);
}

/** User side: the Pal's latest shared position, refreshed every few seconds. */
export function usePalLocation(errandId, enabled) {
  const [position, setPosition] = useState(null);
  useEffect(() => {
    if (!errandId || !enabled) {
      setPosition(null);
      return undefined;
    }
    let alive = true;
    const load = () =>
      getPalLocation(errandId)
        .then((row) => alive && setPosition(row))
        .catch(() => {});
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [errandId, enabled]);
  return position;
}

/** The map point for an address (looked up once, then remembered). */
export function useGeocoded(address) {
  const [point, setPoint] = useState(null);
  useEffect(() => {
    let alive = true;
    setPoint(null);
    geocodeAddress(address).then((result) => alive && setPoint(result));
    return () => {
      alive = false;
    };
  }, [address]);
  return point;
}
