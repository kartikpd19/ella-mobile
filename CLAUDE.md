# CLAUDE.md

Read [AGENTS.md](AGENTS.md) first: it covers the Expo SDK rules, commands, and routing conventions. This file adds what is specific to Ella.

## Project

Ella mobile app (Expo SDK 57, Expo Router, TypeScript). UI only: there is no backend or real authentication yet.

Before declaring work done, run `npx tsc --noEmit` and `npx expo lint`.

## Screens and flow (`src/app/`)

| Route | Screen | Notes |
| --- | --- | --- |
| `/` | Redirect | Sends to `/login` |
| `/login` | Login | Work email must end in `@mayo.edu` (case-insensitive, trimmed) |
| `/verify` | OTP | Test code **123456**; `?email=` shows the address |
| `/scan` | QR scanner | `expo-camera`; any QR is accepted. `?from=home` = re-sync from Home (returns to Home, hides "Use institute login instead") |
| `/welcome` | Permissions | Mic (required), notifications, calendar. Simulated prompts on web |
| `/home` | Home | Draggable bottom sheet; three states (see below). Tapping a visit opens Visit Detail |
| `/visit/[id]` | Visit Detail (`VisitDetailScreen`) | Figma `104:5304`. Header from the tapped visit (initials, name, age, patient ID, status badge); Summary / Transcript / Notes tabs with empty states; pinned "Ready to record?" card |
| `/recording` | Placeholder | "Coming soon", reached only after consent; shows the logged consent |
| `/privacy` | Placeholder | |

Login → OTP → Welcome → Home. QR sign-in from Login goes straight to Home.

The doctor's name comes from the email (`john.smith@mayo.edu` → "Dr. John Smith"), fallback "Dr. Stephen Strange" — see `src/lib/doctor-name.ts`.

## Home bottom sheet

- Built with `@gorhom/bottom-sheet` + `react-native-reanimated`; the root layout wraps the app in `GestureHandlerRootView`.
- Two snap points: **collapsed** (top of sheet just below the greeting) and **expanded** (just below the top bar, so logo, bell and profile stay visible). They are computed from the window height and the header's fixed geometry (constants in `home.tsx`; the greeting is capped at two lines), so they are right on the first frame and never shift. If you change the header layout, update those constants.
- Testing tip: headless Chrome with `--virtual-time-budget` misplaces the sheet (layout events are delayed). Test in a real-time browser instead.
- Tabs and Search are pinned above the scrolling content. Scrolling up while collapsed expands the sheet first; pulling down at the top of the list collapses it. The greeting fades to 30% as the sheet covers it.
- States come from `src/lib/sync-state.ts`: `empty` (Sync now) → `syncing` (after a scan, ~1.5 s) → `synced` (sample visits from `src/lib/sample-visits.ts`, rows in `src/components/visit-row.tsx`).

## Visit Detail and permissions

- Visits are looked up by id with `getVisit(id)`; each sample visit has `age` and `patientId`. The header badge is the note status (`StatusBadge`), falling back to the appointment status when there's no note.
- Tabs on Home and Visit Detail share `src/components/underline-tabs.tsx`.
- Start recording checks the microphone first (`src/lib/permissions.ts`) and asks if it isn't granted; denying shows a message with Open settings (Try again on web).
- On web, permission prompts are simulated by `useSimulatedPermissionPrompt` (`src/components/simulated-permission-prompt.tsx`). Answers are remembered for the session in `permissions.web.ts`, so a mic granted on Welcome is still granted on Visit Detail.
- URL overrides for previews: `?state=empty|syncing|list` and `?sheet=expanded`.

## Recording consent (`ConsentSheet`)

**Recording never starts without consent.** Start recording (Visit Detail) → microphone check → `ConsentSheet` (`src/components/consent-sheet.tsx`, Figma `164:4784`). The only path to `/recording` is `handleConsent` in `src/app/visit/[id].tsx`, which first calls `logConsent(visitId, 'spoken' | 'manual')`.

- The doctor reads `CONSENT_SCRIPT` (copied exactly from Figma) to the patient by name.
- Spoken answers: `expo-speech-recognition` (pinned `~57.1.x` for SDK 57; Expo's installer doesn't know it and would pick a newer major). `src/lib/consent-listener.ts` loads it lazily because it isn't in Expo Go — there the sheet says listening isn't available and offers manual confirm. Needs a development build to actually listen.
- `src/lib/consent-intent.ts` classifies yes/no (refusals checked first). Yes → "Consent received" → recording. No → "Consent not given" + Close, no recording. No answer for 20 s → "read the script again" hint.
- Manual: "Didn't catch it? Confirm yes manually" → "Did the patient verbally agree to recording?" → only "Yes, they agreed" proceeds.
- Privacy: consent audio is never saved (`recordingOptions.persist: false`) and transcripts are only held long enough to classify. `src/lib/consent-log.ts` keeps just method + time (in memory until there's a backend).
- The Figma frame labels this state "0:06 Recording…"; deliberately shown as "Listening for consent…" because nothing is recorded yet.
- Web preview: `consent-listener.web.ts` doesn't listen; the sheet shows "Patient said yes / no" buttons instead.

## Design system

- `design.md` is the source of truth, transcribed from Figma (file `4FqTJq4zxxEAc6bGmCFu1R`). Code tokens live in `src/constants/ella-tokens.ts`; reuse them instead of hard-coding values.
- Values a Figma frame uses that have no token are named constants at the top of the screen file (or `AuthColors` in `src/components/auth-screen.tsx`), with a comment saying where they came from.
- Neue Haas Grotesk and Apercu are licensed and not bundled; `EllaFonts` falls back to Inter.
- The Figma MCP is on the Starter plan and often rate-limited; when it is, build from screenshots the user provides and say so.

## Device preview

With `npx expo start` running, open `http://localhost:8081/preview.html` (`public/preview.html`): phone/tablet frames with the Figma status bar and home indicator, a **Screen** picker (Home adds a **Variant** dropdown: Not synced, Syncing, Visit list, Sheet expanded), and deep links like `?screen=home&state=list&sheet=expanded#both` (the older `?screen=home%3Fstate%3Dlist` form still works). Files in `public/` ship with web exports.

## Git

- Remote: `https://github.com/kartikpd19/ella-mobile` (branch `main`).
- Commit as `Kartikpd <kartikpd.work@gmail.com>` (set in this repo's local git config).
- No Claude attribution lines in commits or PRs.
