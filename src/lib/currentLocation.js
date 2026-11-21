// expo-location is a native module. It is loaded only when the button is tapped, so an app
// build made before it was added still starts normally and shows a clear message instead.
function loadLocation() {
  try {
    return require('expo-location');
  } catch {
    return null;
  }
}

const clean = (value) => (value || '').trim();

/**
 * Asks for permission, reads the phone's position and turns it into the fields of the errand
 * form: one full address (street, area, local government area, city, state) plus the area and
 * state on their own. Throws an Error with a message that is safe to show.
 */
export async function getCurrentPlace() {
  const Location = loadLocation();
  if (!Location) {
    throw new Error(
      'Location needs the latest PalGo app build. Type the location by hand for now.',
    );
  }
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Allow location access in your phone settings, or type the location by hand.');
  }
  if (!(await Location.hasServicesEnabledAsync())) {
    throw new Error('Turn on your phone location (GPS) and try again.');
  }
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const [place] = await Location.reverseGeocodeAsync(position.coords);
  if (!place) throw new Error('We could not work out the address here. Type it by hand.');
  const state = clean(place.region).replace(/ State$/i, '');
  const street = [place.name && place.name !== place.street ? place.name : '', place.street]
    .map(clean)
    .filter(Boolean)
    .join(' ');
  // Street, area (district), local government area (subregion), city, state; no repeats.
  const parts = [street, place.district, place.subregion, place.city, state]
    .map(clean)
    .filter(Boolean)
    .filter(
      (part, index, list) =>
        list.findIndex((x) => x.toLowerCase() === part.toLowerCase()) === index,
    );
  return {
    location: parts.join(', '),
    area: clean(place.district) || clean(place.subregion) || clean(place.city),
    state,
  };
}

/**
 * Starts reading the phone's position every few seconds. Calls onPosition({ latitude, longitude,
 * accuracy }). Resolves to a function that stops it. Throws an Error with a message that is
 * safe to show when permission or GPS is missing.
 */
export async function watchPosition(onPosition) {
  const Location = loadLocation();
  if (!Location) throw new Error('Live location needs the latest PalGo app build.');
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Allow location access so your User can see you on the way.');
  }
  if (!(await Location.hasServicesEnabledAsync())) {
    throw new Error('Turn on your phone location (GPS) so your User can see you on the way.');
  }
  const subscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, timeInterval: 8000, distanceInterval: 0 },
    (position) =>
      onPosition({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }),
  );
  return () => subscription.remove();
}

const geocodeCache = new Map();

async function lookupOpenStreetMap(address) {
  try {
    const url =
      'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ng&q=' +
      encodeURIComponent(address);
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'PalGo/1.0 (errand marketplace app)' },
    });
    if (!response.ok) return null;
    const [hit] = await response.json();
    if (!hit) return null;
    return { latitude: Number(hit.lat), longitude: Number(hit.lon) };
  } catch {
    return null;
  }
}

async function lookupDevice(address) {
  const Location = loadLocation();
  if (!Location) return null;
  try {
    const [hit] = await Location.geocodeAsync(address);
    return hit ? { latitude: hit.latitude, longitude: hit.longitude } : null;
  } catch {
    return null;
  }
}
/**
 * Turns an address into { latitude, longitude }, or null if it cannot be found. Pass a list of
 * addresses (most exact first) and the first one that is found is used, so a house in an estate
 * that the map does not know still falls back to its street, area or city.
 */
export async function geocodeAddress(address) {
  const candidates = (Array.isArray(address) ? address : [address]).map(clean).filter(Boolean);
  const key = candidates.join('|').toLowerCase();
  if (!key) return null;
  if (geocodeCache.has(key)) return geocodeCache.get(key);
  for (const candidate of candidates) {
    // OpenStreetMap first: every phone gets the same answer. The phone's own geocoder is the
    // fallback (it differs between devices and is missing on some).
    const hit = (await lookupOpenStreetMap(candidate)) || (await lookupDevice(candidate));
    if (hit) {
      geocodeCache.set(key, hit);
      return hit;
    }
  }
  return null; // not remembered, so a later try (better network) can succeed
}

/** The addresses to try for an errand, most exact first. */
export function errandAddressCandidates(errand) {
  if (!errand?.location) return [];
  const full = clean(errand.location);
  const tail = [errand.area, errand.city, errand.state].map(clean).filter(Boolean);
  const parts = full.split(',').map(clean).filter(Boolean);
  const list = [
    [full, ...tail].join(', '),
    full,
    parts.slice(1).join(', '),
    parts.slice(-3).join(', '),
    tail.join(', '),
  ];
  return list.filter((item, index) => item && list.indexOf(item) === index);
}
