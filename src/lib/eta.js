// Straight-line distance and a rough arrival time. There is no routing service connected,
// so the estimate adds a road factor and assumes city traffic speed. It is labelled
// "about" everywhere it is shown.
const EARTH_KM = 6371;
const ROAD_FACTOR = 1.3;
const CITY_SPEED_KMH = 20;
const ARRIVED_KM = 0.15;
/** A position older than this is treated as "not live". */
export const STALE_MS = 3 * 60 * 1000;

const rad = (deg) => (deg * Math.PI) / 180;

export function distanceKm(a, b) {
  if (!a || !b) return null;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** { arrived, minutes } for a straight-line distance in km. */
export function describeEta(km) {
  if (km == null) return null;
  if (km <= ARRIVED_KM) return { arrived: true, minutes: 0 };
  return {
    arrived: false,
    minutes: Math.max(1, Math.round(((km * ROAD_FACTOR) / CITY_SPEED_KMH) * 60)),
  };
}

export const isFresh = (iso, now = Date.now()) =>
  Boolean(iso) && now - new Date(iso).getTime() < STALE_MS;
