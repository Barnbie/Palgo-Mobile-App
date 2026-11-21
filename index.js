import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import App from './App';

// Keep the splash up until App has loaded its pictures (see App.js).
SplashScreen.preventAutoHideAsync().catch(() => {});

registerRootComponent(App);
