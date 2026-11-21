// expo-location is a native module. If the installed build was made before it was added,
// requiring it fails; the caller then gets a clear message instead of a crash.
let Location = null;
try {
  Location = require('expo-location');
} catch {
  Location = null;
}

const first = (...values) => values.map((v) => (v || '').trim()).find(Boolean) || '';

/**
 * Asks for permission, reads the phone's position and turns it into the fields of the errand
 * form: street address, area (neighbourhood), city and state.
 * Throws an Error with a message that is safe to show.
 */
export async function getCurrentPlace() {
  if (!Location) {
    throw new Error(
      'Location needs the latest PalGo app build. Enter the location by hand for now.',
    );
  }
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Allow location access in your phone settings, or enter the location by hand.');
  }
  if (!(await Location.hasServicesEnabledAsync())) {
    throw new Error('Turn on your phone location (GPS) and try again.');
  }
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const [place] = await Location.reverseGeocodeAsync(position.coords);
  if (!place) throw new Error('We could not work out the address here. Enter it by hand.');
  const street = [place.name && place.name !== place.street ? place.name : '', place.street]
    .filter(Boolean)
    .join(' ');
  return {
    location: [street, first(place.district, place.subregion), first(place.city)]
      .filter(Boolean)
      .join(', '),
    area: first(place.district, place.subregion, place.city),
    state: first(place.region).replace(/ State$/i, ''),
  };
}
