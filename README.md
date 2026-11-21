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

## Speed: pictures (21 Nov 2026)
- The splash stays up until the app's pictures are loaded (`src/lib/preloadAssets.js`), so backgrounds and illustrations are ready when a screen opens. Profile photos are prefetched and fade in; while loading, only the quiet user icon shows (no placeholder words). Placeholder labels remain only for artwork that has not been added yet.
- In development, pictures are fetched from the computer over wifi, so first loads are slower than in an installed release build.

## Stage: requested time on cards + testing with one account

- Errand cards show the requested time (for example "12pm") on the right, opposite the status. The duration shows in the details pages.
- **Testing switch:** while one account is both the User and the Pal, the Pal feed would hide your own errands. `public.app_flags.allow_self_errands` (now `true`) lets an account see, accept and counter-offer its own errands, and notifies it. **Before launch run:** `update public.app_flags set allow_self_errands = false;`
- Pal ID verification is not required (`require_verified_pals()` is false); it will be switched on when ID verification is built.

## Stage: errand cards, active errand screens (from Figma)

- Pal Home: available errands use the same card as the Errands list: **View details** (blue) and **Counter offer** (green). Accept lives inside the details page, next to Counter offer.
- Active errand cards on Home (User and Pal) use the same card with the other person's photo, name and stars, and the 3D buttons. No ID / phone verification badges.
- Back from View details now returns to where you came from (Errands or Home).
- Active errand screens follow the Figma frames "Active Errand" (User) and "Active errand pal" (Pal): handle, headline, Contact / photo + rating / Safety (User), status line, "Your current service" rows, Payment, Share / Call emergency / Cancel. Code: `src/features/errands/activeErrand.js`. New icons: phone+chat, safety shield, siren, share, cancel.
- Not connected yet (shown honestly in the app): chat/calling (messaging stage), cancelling an accepted errand, and payment method (the "Transfer" line follows the design).
- Toast (bottom notification) is dark in dark mode.

## Stage: active errand polish, chat, cancel with reason

- Contact button is one icon: a big white phone with a small chat bubble in its hollow. Safety is a shield with a person badge. Rating pill is raised (3D) and shows an empty star and `0.0` when there are no reviews. Status dot has a lighter inner circle. Profile photos are 60px with a single border.
- Login button says "Logging in…" while it works.
- Profile photos no longer blink: signed photo links are reused for 25 minutes and images fade in only the first time.
- **Chat** (`src/features/chat`, `src/lib/api/chat.js`): messages table with RLS (only the User and Pal on the errand, only while accepted/active/pal_completed), realtime updates plus an 8 s backup poll, one notification for the first unread message. The phone icon in the chat opens the phone's dialer with the other person's number (`get_errand_contact_phone`). No in-app calling.
- **Cancel with a reason** (`src/features/errands/cancel.js`, RPC `cancel_errand`): User cancelling sets the errand to cancelled; a Pal cancelling puts it back to pending for other Pals. Reasons are recorded in `errand_cancellations`. If the errand had already started and the reason is not "We agreed to cancel together", `penalty_flag` is recorded. **Nothing is charged**; the fee amount and rules are decided when payments are built.
- Migration `202611210002_chat_and_cancel.sql` must be applied to Supabase.
- Not built yet: estimated arrival (needs live location).

## Stage: live location and estimated arrival

- **Pal side:** while the Pal has an accepted or running errand and the app is open, the phone's position is sent every ~7 s (`usePalLocationSharing`, RPC `share_pal_location`). The Pal sees a line saying their location is shared. The position is deleted when the errand is no longer accepted or running.
- **User side:** the Pal's latest position is read every 6 s (`get_pal_location`) and shown on the map with the errand's location. A position older than 3 minutes is treated as "not live".
- **Estimated arrival:** `src/lib/eta.js`: straight-line distance × 1.3 road factor at 20 km/h city speed, always shown as "about N min". The errand address is turned into a map point with the phone's geocoder. For real road times connect a routing service (Google Directions) later.
- Foreground only: the position stops sending when the app is closed. Background tracking needs extra permissions and a new build, planned for later.
- Migration `live_location` (applied). Also applied: `chat_and_cancel`.

## Stage: background location, polish, unread badge

- **Background location:** while a Pal has an accepted or running errand, `expo-task-manager` + `expo-location` keep sending the position when the Pal switches to another app (`src/lib/backgroundLocation.js`, task defined in `index.js`). Android shows "PalGo errand in progress". The Pal must set location to "Allow all the time"; otherwise sharing continues only while the app is open and a message explains how. **Needs a new EAS development build** (new native module + permissions). Google Play will ask for a background-location declaration when publishing.
- Location never "goes stale": a Pal standing still (hold-up, market) keeps reporting every ~15 s; the User keeps the last known position and estimate, with a small "last update N min ago" note if reports stop.
- Map colours: you are blue, the other person is green (both sides).
- Tab bar has a shadow; the Errands tab uses the Material Symbols "moped_package" icon (solid when active, hollow when inactive).
- Chat bubbles use the raised input look on a white body (`RaisedBubble`). The contact button shows a red unread-count badge on both sides (`chat_reads`, `get_unread_message_count`, migration `202611210004_chat_unread.sql`).

## Stage: required phone, sheet heights, completion confirm

- **Phone is required** on sign-up for both User and Pal (screen + database: `202611210005_require_phone_signup.sql` rejects new sign-ups without a valid number). Existing accounts without one can add it in Profile.
- Tab bar shadow is a soft eased gradient (low and short).
- Home sheet opens at medium height when there is something to act on: User = an active errand; Pal = available errands. Otherwise it opens at the lowest height.
- **Completion:** only the Pal completes. The User has no Complete button; when the Pal marks complete the User gets an "Is your errand complete?" pop-up (and a Confirm button on the card/details). Payment steps follow in the payments stage.
