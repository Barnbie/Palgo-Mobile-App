import * as SecureStore from 'expo-secure-store';
import { sharePalLocation } from './api/liveLocation';
import { setLatestPosition } from './liveLocation';

// Keeps sharing the Pal's position while the app is in the background (the person switched
// to another app). Android shows a small "PalGo errand in progress" notification while it runs.
// expo-task-manager is a native module, so it is loaded only when used: a build made before it
// was added still starts normally and falls back to sharing while the app is open.
export const TASK_NAME = 'palgo-errand-location';
const ERRAND_KEY = 'palgo.sharing.errand';

// Literal require() calls (Metro needs them) inside try/catch.
function loadLocation() {
  try {
    return require('expo-location');
  } catch {
    return null;
  }
}
function loadTaskManager() {
  try {
    return require('expo-task-manager');
  } catch {
    return null;
  }
}

/** Call once when the app starts (index.js), before anything renders. */
export function defineBackgroundTask() {
  const TaskManager = loadTaskManager();
  if (!TaskManager) return;
  TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
    if (error || !data?.locations?.length) return;
    const point = data.locations[data.locations.length - 1].coords;
    const errandId = await SecureStore.getItemAsync(ERRAND_KEY).catch(() => null);
    if (!errandId) return;
    setLatestPosition({
      latitude: point.latitude,
      longitude: point.longitude,
      accuracy: point.accuracy,
    });
    await sharePalLocation(errandId, point.latitude, point.longitude, point.accuracy).catch(
      () => {},
    );
  });
}

/**
 * Starts background sharing for the errand. Resolves to true when it is running, false when
 * it could not start (permission "all the time" not given, or an older build).
 */
export async function startBackgroundSharing(errandId) {
  const Location = loadLocation();
  const TaskManager = loadTaskManager();
  if (!Location || !TaskManager) return false;
  try {
    let permission = await Location.getBackgroundPermissionsAsync();
    if (permission.status !== 'granted') {
      permission = await Location.requestBackgroundPermissionsAsync();
    }
    if (permission.status !== 'granted') return false;
    await SecureStore.setItemAsync(ERRAND_KEY, errandId);
    if (await Location.hasStartedLocationUpdatesAsync(TASK_NAME)) return true;
    await Location.startLocationUpdatesAsync(TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 8000,
      distanceInterval: 0,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'PalGo errand in progress',
        notificationBody: 'Sharing your live location with your User.',
        notificationColor: '#2563EB',
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function stopBackgroundSharing() {
  const Location = loadLocation();
  await SecureStore.deleteItemAsync(ERRAND_KEY).catch(() => {});
  if (!Location) return;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(TASK_NAME)) {
      await Location.stopLocationUpdatesAsync(TASK_NAME);
    }
  } catch {
    // Nothing was running.
  }
}
