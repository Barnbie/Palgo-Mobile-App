import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { geocodeAddress, watchPosition } from '../lib/currentLocation';
import { getPalLocation, sharePalLocation } from '../lib/api/liveLocation';
import { setLatestPosition } from '../lib/liveLocation';
import { startBackgroundSharing, stopBackgroundSharing } from '../lib/backgroundLocation';

const RUNNING = ['ACCEPTED', 'ACTIVE'];
const SEND_EVERY_MS = 7000;
// A Pal standing still (market, traffic) still reports, so the User keeps seeing a live dot.
const HEARTBEAT_MS = 15000;
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
  const backgroundWarned = useRef('');
  useEffect(() => {
    if (!errandId) {
      setLatestPosition(null);
      stopBackgroundSharing();
      return undefined;
    }
    let cancelled = false;
    let stop = null;
    let lastSent = 0;
    let lastPosition = null;
    const send = (position) => {
      lastSent = Date.now();
      sharePalLocation(errandId, position.latitude, position.longitude, position.accuracy).catch(
        () => {},
      );
    };
    watchPosition((position) => {
      lastPosition = position;
      setLatestPosition(position);
      if (Date.now() - lastSent >= SEND_EVERY_MS) send(position);
    })
      .then((stopWatching) => {
        if (cancelled) {
          stopWatching();
          return;
        }
        stop = stopWatching;
        // Keep going when the Pal switches to another app (needs "allow all the time").
        startBackgroundSharing(errandId).then((running) => {
          if (!running && !cancelled && backgroundWarned.current !== errandId) {
            backgroundWarned.current = errandId;
            Alert.alert(
              'Keep location on in the background',
              'To keep sharing your location when you switch to another app, set PalGo’s location permission to “Allow all the time” in your phone settings.',
            );
          }
        });
      })
      .catch((error) => {
        if (warned.current === errandId) return;
        warned.current = errandId;
        Alert.alert('Live location is off', error?.message || 'We could not read your location.');
      });
    const heartbeat = setInterval(() => {
      if (lastPosition && Date.now() - lastSent >= HEARTBEAT_MS) send(lastPosition);
    }, HEARTBEAT_MS);
    return () => {
      cancelled = true;
      clearInterval(heartbeat);
      if (stop) stop();
      stopBackgroundSharing();
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
  const key = JSON.stringify(address || '');
  useEffect(() => {
    let alive = true;
    let timer;
    setPoint(null);
    // Try again a few times: the first lookup can fail on a weak network.
    const attempt = (left) =>
      geocodeAddress(address).then((result) => {
        if (!alive) return;
        if (result) setPoint(result);
        else if (left > 0 && address && address.length)
          timer = setTimeout(() => attempt(left - 1), 6000);
      });
    attempt(3);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return point;
}
