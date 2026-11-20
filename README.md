# Palgo-Mobile-App

PalGo is a React Native/Expo errand app. User sign-up now creates accounts through Supabase Auth; Pal sign-up, login, payments, and withdrawals are still demo flows.

## Run

```bash
npm install
npx expo start
```

Use the on-screen role picker to demonstrate the User or Pal journey. The app persists its mock state while it is open.

## Google Maps

Create separate, platform-restricted Google Maps keys and add them to the local `.env` file as `GOOGLE_MAPS_API_KEY` (Android) and `GOOGLE_MAPS_IOS_API_KEY` (iOS). `app.config.js` passes those values to Expo's native maps configuration. Rebuild the native app after changing either key.

## Supabase User sign-up

Copy `.env.example` to `.env` and fill `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the Supabase project settings. `.env` is ignored by Git. Only use the publishable key in this mobile app; never put a Supabase secret or `service_role` key in the app. Restart Expo after changing environment values.

User sign-up stores the full name and `role: user` in Supabase Auth metadata. Confirmation uses a six-digit email OTP, then shows an Email verified screen before continuing. In Supabase, enable email confirmations and edit **Authentication → Email Templates → Confirm signup** so the message contains `{{ .Token }}` (the six-digit code) instead of only `{{ .ConfirmationURL }}`. The client verifies it with Supabase Auth's OTP endpoint.

Supabase's built-in SMTP is suitable only for early testing: it currently sends only to project team addresses and is rate-limited. For sign-ups from arbitrary Gmail inboxes, configure a custom SMTP provider in Supabase Auth. Resend is the recommended provider for this project; it can deliver to Gmail recipients, but the From address must use a domain you control and verify. Keep SMTP credentials in Supabase's server-side SMTP settings, never in this app's `.env`.

## Architecture

- `App.js` contains the screen renderer and app state; UI screens and reusable components are organized under `src/features` and `src/AppComponents.js`.
- `src/lib/supabase.js` contains the Supabase client and User sign-up/confirmation calls. Payment and withdrawal adapters remain demo implementations.
- `commissionRate` is the single source of truth for the PalGo commission calculation.
