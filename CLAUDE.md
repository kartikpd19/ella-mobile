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
| `/home` | Home | Draggable bottom sheet; three states (see below) |
| `/privacy` | Placeholder | |

Login → OTP → Welcome → Home. QR sign-in from Login goes straight to Home.

The doctor's name comes from the email (`john.smith@mayo.edu` → "Dr. John Smith"), fallback "Dr. Stephen Strange" — see `src/lib/doctor-name.ts`.

## Home bottom sheet

- Built with `@gorhom/bottom-sheet` + `react-native-reanimated`; the root layout wraps the app in `GestureHandlerRootView`.
- Two snap points: **collapsed** (top of sheet just below the greeting) and **expanded** (just below the top bar, so logo, bell and profile stay visible). They are computed from window size plus measured header layout, with first-frame estimates so the sheet never waits on `onLayout`.
- Tabs and Search are pinned above the scrolling content. Scrolling up while collapsed expands the sheet first; pulling down at the top of the list collapses it. The greeting fades to 30% as the sheet covers it.
- States come from `src/lib/sync-state.ts`: `empty` (Sync now) → `syncing` (after a scan, ~1.5 s) → `synced` (sample visits from `src/lib/sample-visits.ts`, rows in `src/components/visit-row.tsx`).
- URL overrides for previews: `?state=empty|syncing|list` and `?sheet=expanded`.

## Design system

- `design.md` is the source of truth, transcribed from Figma (file `4FqTJq4zxxEAc6bGmCFu1R`). Code tokens live in `src/constants/ella-tokens.ts`; reuse them instead of hard-coding values.
- Values a Figma frame uses that have no token are named constants at the top of the screen file (or `AuthColors` in `src/components/auth-screen.tsx`), with a comment saying where they came from.
- Neue Haas Grotesk and Apercu are licensed and not bundled; `EllaFonts` falls back to Inter.
- The Figma MCP is on the Starter plan and often rate-limited; when it is, build from screenshots the user provides and say so.

## Device preview

With `npx expo start` running, open `http://localhost:8081/preview.html` (`public/preview.html`): phone/tablet frames with the Figma status bar and home indicator, a **Screen** picker, and links like `?screen=home%3Fstate%3Dlist#mobile`. Files in `public/` ship with web exports.

## Git

- Remote: `https://github.com/kartikpd19/ella-mobile` (branch `main`).
- Commit as `Kartikpd <kartikpd.work@gmail.com>` (set in this repo's local git config).
- No Claude attribution lines in commits or PRs.
