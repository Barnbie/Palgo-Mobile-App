# PalGo

PalGo is an Expo SDK 58 / React Native errand marketplace. **Users** post errands and **Pals** accept and complete them. The backend is Supabase (Auth, Postgres with RLS, Storage, one Edge Function).

## Run on your phone (EAS development build)

```bash
pnpm install
pnpm start          # = expo start --dev-client
```

Open the PalGo development build already installed on your phone and scan the QR code (or pick the server from the build's launcher). If the phone and Mac are on different networks, use `pnpm start -- --tunnel`.

Rebuild the native app (`eas build --profile development --platform android`) only when native modules or `app.config.js` change. This refactor removed `expo-sqlite` and `expo-location`, which only matters for your next rebuild; JavaScript changes need no rebuild.

Other scripts: `pnpm lint`, `pnpm format`, `pnpm test`, `pnpm check` (lint + format check + tests). CI (`.github/workflows/ci.yml`) runs the same checks plus an `expo export` smoke test.

## Environment

Copy `.env.example` to `.env` and fill:

- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable key only, never a `service_role` key).
- `GOOGLE_MAPS_API_KEY` (Android) and `GOOGLE_MAPS_IOS_API_KEY` (iOS), platform-restricted. Rebuild the native app after changing them.

## Supabase setup

Apply the migrations in `supabase/migrations` in order:

1. `202611150001_private_pal_id_storage.sql` – private buckets for Pal ID documents and profile photos.
2. `202611150002_real_profiles_errands_reviews.sql` – profiles, errands, reviews, RLS, and the errand/review functions.
3. `202611200001_security_hardening.sql` – server-controlled roles and Pal status, column-level grants, address privacy, tighter photo access, `app_settings`.

Enable email confirmation and put `{{ .Token }}` in **Authentication → Email Templates → Confirm signup** (sign-up uses a six-digit OTP). Built-in SMTP is for testing only; use a custom SMTP provider (e.g. Resend) for real users.

Deploy `supabase/functions/delete-account` (`supabase functions deploy delete-account`) for in-app account deletion. It is not deployed yet.

### Security model

- Roles and Pal verification are never taken from client-writable auth metadata. The `sync_role_profile` trigger creates the profile; Pal details go through `save_pal_profile`.
- ID number, address and documents live in `pal_profiles` / private Storage, with column-level update grants.
- Pending errands hide the exact address and notes from Pals until accepted.
- Auth tokens are stored in Expo SecureStore (chunked), not SQLite.
- `app_settings.require_verified_pals` is `false`. Set it to `true` once Pal ID review exists; Pals then must be verified to accept errands.

## Architecture

- `App.js` – small shell: wires state hooks, resolves the current route, renders it.
- `src/navigation` – route table (`resolveRoute`, tabs, notices). Each route returns `{ view, back }`; Android back follows `back`.
- `src/state` – hooks: `useRouter`, `usePreferences`, `useAccount` (session, roles, profile), `useErrands` (list, refresh every 20 s, on foreground and after changes), `useWithdrawalPin`.
- `src/lib` – `supabase.js`, `secureStorage.js`, `mappers.js`, and `api/{auth,profile,errands}.js`.
- `src/features/*` – screens; `src/AppComponents.js` – shared components.

## Progress log

- [x] Authentication (email OTP sign-up, login, password/email change, delete account)
- [x] Roles/Pal status server-controlled; ID and address moved out of auth metadata
- [x] Address privacy for pending errands; photo access limited to errand counterparts
- [x] Tokens moved to SecureStore
- [x] `App.js` split into hooks and routes; dead code removed
- [x] Single source of truth for profile data; errands refresh automatically
- [x] ESLint, Prettier, Jest, GitHub Actions CI
- [ ] Pal identity verification review (deferred)
- [ ] Errand lifecycle: cancel/release of accepted errands, disputes (deferred)
- [ ] Payments, messaging, withdrawals (demo only / removed)
- [ ] Dark-mode styling (setting exists but does not restyle yet)

## Removed in the refactor

Unused chat, payment, receipt and counter-offer screens and the `commissionRate` helper were removed as dead code. They remain in git history at commit `82cba83`.

## Progress: profile and settings (20 Nov 2026)
- Look: code-drawn icons, 3D inputs, dark mode inside the app, gradient buttons.
- Support page: WhatsApp, phone and email cards (placeholders live in `src/config/contact.js`).
- Terms and Privacy drafts live in `src/features/profile/legal.js` (needs legal review).
- Settings saved to Supabase: phone number, push and email notification switches, Pal availability (migration `202611200003`).
- App language (English, Yoruba, Igbo, Hausa, Pidgin) in `src/i18n/index.js`; strings not in the list stay English.
- Password change now checks the current password. `delete-account` edge function is deployed.
- Not done yet: real push/email delivery (needs Firebase and a Brevo API key), phone verification, Pal ID review.

## Notifications (20 Nov 2026)
- In-app feed: `notifications` table, shown on the bell screen. Errand status changes create rows through a database trigger.
- Delivery: each new row calls the `send-notification` edge function, which sends an Expo push (to tokens in `push_tokens`) and a Brevo email, depending on the person's switches.
- To finish setup: add `BREVO_API_KEY` and `MAIL_FROM_EMAIL` as Supabase Edge Function secrets; for Android push add a Firebase `google-services.json` (EAS file variable `GOOGLE_SERVICES_JSON`) and upload the FCM credentials with `eas credentials`; then make a new EAS development build (adds `expo-notifications`).
