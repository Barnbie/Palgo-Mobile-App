export default ({ config }) => {
  const androidMapsKey = process.env.GOOGLE_MAPS_API_KEY;
  const iosMapsKey = process.env.GOOGLE_MAPS_IOS_API_KEY;
  const plugins = [
    ...(config.plugins || []),
    '@react-native-community/datetimepicker',
    'expo-splash-screen',
    'expo-notifications',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'PalGo uses your location to fill in where your errand is, and to show your User where you are while you run their errand.',
        locationAlwaysAndWhenInUsePermission:
          'PalGo keeps sharing your location with your User while you run their errand, even when you switch to another app.',
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
  ];

  // This configures Maps in a custom native build. Expo Go already bundles
  // react-native-maps and does not read this project API key at runtime.
  if (androidMapsKey || iosMapsKey) {
    plugins.push([
      'react-native-maps',
      {
        ...(androidMapsKey ? { androidGoogleMapsApiKey: androidMapsKey } : {}),
        ...(iosMapsKey ? { iosGoogleMapsApiKey: iosMapsKey } : {}),
      },
    ]);
  }

  return {
    ...config,
    plugins,
    // Expo's manifest asset resolver traverses optional nested fields such as
    // android.adaptiveIcon and web.splash even when no image has been set.
    android: {
      ...config.android,
      package: config.android?.package || 'com.palgo.prototype',
      adaptiveIcon: { ...config.android?.adaptiveIcon },
      // Firebase file for Android push notifications (kept in the project root).
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
      ...(androidMapsKey
        ? {
            config: {
              ...config.android?.config,
              googleMaps: { apiKey: androidMapsKey },
            },
          }
        : {}),
    },
    ios: {
      ...config.ios,
      bundleIdentifier: config.ios?.bundleIdentifier || 'com.palgo.prototype',
      ...(iosMapsKey
        ? {
            config: {
              ...config.ios?.config,
              googleMapsApiKey: iosMapsKey,
            },
          }
        : {}),
    },
    web: {
      ...config.web,
      splash: { ...config.web?.splash },
    },
  };
};
