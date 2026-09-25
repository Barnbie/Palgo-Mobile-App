# Palgo-Mobile-App

Errand Application built as an interactive React Native/Expo mobile prototype from the supplied PalGo flows and PRD. It uses local state and service adapters only; no real login, payment, GPS, chat, or banking integration is required.

An interactive React Native/Expo mobile prototype built from the supplied PalGo flows and PRD. It uses local state and service adapters only; no real login, payment, GPS, chat, or banking integration is required.

## Run

```bash
npm install
npx expo start
```

Use the on-screen role picker to demonstrate the User or Pal journey. The app persists its mock state while it is open.

## Architecture

- `App.js` contains the screen renderer, reusable native components and local state.
- `services` contains mock adapters for auth, payment and withdrawals. Replace these methods with API clients later without changing screen components.
- `commissionRate` is the single source of truth for the PalGo commission calculation.
