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

## Counter offers and errand cards (20 Nov 2026)
- A Pal can answer a pending errand with their own price and note (`make_counter_offer`). The User sees each offer as a card with the Pal's photo, name, rating and amount, opens the details, and accepts or declines (`accept_counter_offer`, `decline_counter_offer`). Accepting assigns that Pal at the offered price and declines the other offers. Migration `202611200005_counter_offers.sql` (applied live).
- Errand cards: larger amount, two equal buttons. View details (blue, left) plus Cancel (pending), Complete (active) or Accept (offer / Pal pending, green, right).
- Pals see "Offer sent" on errands they offered on. New alerts go through the existing notification pipeline.

## Dark mode and theme (21 Nov 2026)
- Dark mode: errand cards use the navy card colour; selected chips/tiles are blue in dark mode (green in light mode).
- The theme choice (light / dark / system) is saved on the device and on the login (`user_metadata.theme_mode`), so it survives logout/login and applies to both User and Pal.

## Pal errand feed and notification bell (21 Nov 2026)
- Pals choose what they receive: by default only errands that match the skills they signed up with; the "Receive all errands" switch in Pal settings turns on every errand (`pal_profiles.receive_all_errands`, migration `202611200006`). Matching, available Pals get a "New errand available" notification when an errand is posted. Category-to-skill matching lives in `skills_for_category()`; location is not used yet.
- Home and Pal wallet show a plain bell with a red unread count (nothing when there are none). The notifications page has an icon and text when empty.
- Errand cards: pending amber, active blue, completed green, cancelled red; amount is green in dark mode. Errand and date filter chips stay green in dark mode.

## Area matching, custom skills, detail icons (21 Nov 2026)
- Errands now have an Area (neighbourhood) and State; Pals list the areas they work in (sign-up and Occupation / Skills settings). Migration `202611200007`.
- Local errands (shopping, pickup, delivery, cleaning, repairs, others) go to Pals whose areas match; Styling and Cooking are wide, matched by state. Pals with no areas fall back to state matching. "Receive all errands" lifts the skill filter only, not the location filter.
- New categories Styling and Cooking; new Pal skills Makeup artist and Caterer.
- Whatever a Pal types under "Others" becomes one of their skills and is collected in `skill_suggestions` for the team.
- Errand detail icons sit in a very light circle of their own colour.

## Spelling tolerance, vicinity, current location (21 Nov 2026)
- Place matching forgives small spelling mistakes (`place_matches` uses `fuzzystrmatch`). A Pal's vicinity is the areas they listed plus the city and address from sign-up (migration `202611200008`).
- "Receive all errands" now means every errand, any skill, anywhere.
- "Use current location" on the errand form fills the address, area and state from the phone's GPS (`src/lib/currentLocation.js`, `expo-location`). It needs a new EAS development build.

## One location field (21 Nov 2026)
- The errand form has a single required location field: typed by hand, or filled by Use current location (street, area, local government area, city, state). Area and State inputs were removed.
- Matching uses the location text: its parts are compared (with spelling tolerance) with the Pal's sign-up address, city and listed areas. The state is worked out from the text (`infer_state`). Pals see the address without its first (street) line. Migration `202611200009`.
- `expo-location` is loaded only when the button is tapped, so older builds still start.
