// Replace either `null` value with the image file you add under `assets/`.
// Example: onboarding: require('../assets/onboarding-background.png')
// The supplied image will cover the full mobile screen.
export const palgoBackgrounds = {
  onboarding: require('../src/assets/onboarding.png'),
  authentication: require('../src/assets/authentication.png'),
};

// The splash and onboarding areas intentionally have separate logo sources.
// You may keep the same image for both, or replace either filename below.
export const palgoLogos = {
  splash: require('./assets/splash-logo.png'),
  onboarding: require('./assets/palgo-logo.png'),
};

// These are the decorative button BACKGROUNDS. The Lucide notification icon
// remains on top of the notification background.
// Example: profile: require('./assets/home-profile-button-background.png')
export const homeActionImages = {
  profile: require('./assets/home-icon-background.png'),
  notifications: require('./assets/home-icon-background.png'),
};

// This is the fallback/profile image shown in the centre of the profile button.
// Keep it null to show the user icon placeholder. Replace it with an uploaded
// user's local/remote image source when authentication is connected.
export const homeProfileImage = null;

// Active-errand action images include BOTH their icon and their background.

// Profile header art and the fallback/user profile image are separate.
export const profileAssets = { headerBackground: null, profileImage: null };

// Screen-specific artwork slots. Leave a value as null to keep its labelled
// placeholder; change only the filename here after adding your PNG/JPG under
// src/assets/. These images are backgrounds, so they never crop the content
// placed on top of them.
export const uiPlaceholders = {
  profileHeaderBackground: null,
  personalInfoBackground: null,
  palCombinedContact: require('./assets/contact-pal.png'),
  walletHelloBackground: null,
  walletBalanceBackground: null,
  walletPromoCard: null,
  withdrawSuccessImage: null,
};

// Add the three central onboarding illustrations to `src/assets/`, then replace
// the matching `null` below. Example:
// require('./assets/onboarding-slide-1.png')
export const onboardingSlideImages = [
  require('./assets/onboarding-slide-1.png'),
  require('./assets/onboarding-slide-2.png'),
  require('./assets/onboarding-slide-3.png'),
];
