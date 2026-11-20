export default ({ config }) => {
  const androidMapsKey = process.env.GOOGLE_MAPS_API_KEY;
  const iosMapsKey = process.env.GOOGLE_MAPS_IOS_API_KEY;
  const plugins = [
    ...(config.plugins || []),
    '@react-native-community/datetimepicker',
    'expo-splash-screen',
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
