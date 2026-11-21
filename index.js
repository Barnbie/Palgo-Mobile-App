import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import App from './App';
import { defineBackgroundTask } from './src/lib/backgroundLocation';

// Keep the splash up until App has loaded its pictures (see App.js).
SplashScreen.preventAutoHideAsync().catch(() => {});

// The background location task must be defined as the app starts.
defineBackgroundTask();

registerRootComponent(App);
