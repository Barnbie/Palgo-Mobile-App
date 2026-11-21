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
    { accuracy: Location.Accuracy.Balanced, timeInterval: 8000, distanceInterval: 10 },
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
/** Turns an address into { latitude, longitude }, or null if it cannot be found. */
export async function geocodeAddress(address) {
  const key = clean(address).toLowerCase();
  if (!key) return null;
  if (geocodeCache.has(key)) return geocodeCache.get(key);
  const Location = loadLocation();
  if (!Location) return null;
  try {
    const [hit] = await Location.geocodeAsync(clean(address));
    const result = hit ? { latitude: hit.latitude, longitude: hit.longitude } : null;
    geocodeCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}
