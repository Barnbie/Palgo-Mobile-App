import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { savePushToken } from './api/notifications';

// expo-notifications is a native module. If the installed build was made before it was
// added, requiring it fails; everything here then quietly does nothing instead of crashing.
let Notifications = null;
let Device = null;
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch {
  Notifications = null;
}

let handlerSet = false;
function ensureHandler() {
  if (!Notifications || handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Asks permission, gets this phone's Expo push token and stores it for the signed-in
 * account. Returns a short status string (useful for logs); never throws.
 */
export async function registerForPush(userId) {
  try {
    if (!Notifications || !Device) return 'unavailable';
    if (!Device.isDevice) return 'simulator';
    ensureHandler();
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'PalGo',
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return 'denied';
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    await savePushToken(userId, token, Platform.OS);
    return 'registered';
  } catch (error) {
    console.info('[Palgo push] registration skipped:', error?.message);
    return 'failed';
  }
}
