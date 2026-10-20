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
| `/visit/[id]` | Visit Detail (`VisitDetailScreen`) | Figma `104:5304`; once a recording is saved it becomes the visit summary (Figma `293:6174`, see below). Header from the tapped visit (initials, name, age, patient ID, status badge); Summary / Transcript / Notes tabs with empty states; pinned "Ready to record?" card |
| `/recording` | Recording (`RecordingScreen`) | Figma `104:4501` (quiet) / `104:4459` (speaking). Reached only after consent and the countdown. Fades in, swipe-back off (`_layout.tsx`). `?sim=quiet\|speaking\|paused` previews it in the browser |
| `/edit-summary` | Placeholder | "Coming soon" from Edit on the visit summary |
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

**Recording never starts without consent.** Start recording (Visit Detail) → microphone check → `ConsentSheet` (`src/components/consent-sheet.tsx`, Figma `164:4784`). The only path to `/recording` is `handleConsent` in `src/app/visit/[id].tsx`, which first calls `logConsent(visitId, 'spoken' | 'manual')`, then plays `RecordingCountdown`; `startRecordingNow` navigates once it finishes.

- The doctor reads `CONSENT_SCRIPT` (copied exactly from Figma) to the patient by name.
- Spoken answers: `expo-speech-recognition` (pinned `~57.1.x` for SDK 57; Expo's installer doesn't know it and would pick a newer major). `src/lib/consent-listener.ts` loads it lazily because it isn't in Expo Go — there the sheet says listening isn't available and offers manual confirm. Needs a development build to actually listen.
- `src/lib/consent-intent.ts` classifies yes/no (refusals checked first). Yes → "Consent received" → recording. No → "Consent not given" + Close, no recording. No answer for 20 s → "read the script again" hint.
- Manual: "Didn't catch it? Confirm yes manually" → "Did the patient verbally agree to recording?" → only "Yes, they agreed" proceeds.
- Privacy: consent audio is never saved (`recordingOptions.persist: false`) and transcripts are only held long enough to classify. `src/lib/consent-log.ts` keeps just method + time (in memory until there's a backend).
- The Figma frame labels this state "0:06 Recording…"; deliberately shown as "Listening for consent…" because nothing is recorded yet.
- Web preview: `consent-listener.web.ts` doesn't listen, so only the manual path works in the browser.

## Recording countdown (`RecordingCountdown`)

After consent, `src/components/recording-countdown.tsx` (Figma `104:5359`–`104:5368`, "iPhone 16 - 65…68") covers Visit Detail full screen: **3**, **2**, **1** (0.8 s each), then "Wishing you a great session! 😊" (1.2 s), then `/recording` (`RecordingScreen`).

- **Recording starts only in `onDone`**, after the final message. Nothing is captured during the countdown; when real capture and the timer are built, start them there.
- One Reanimated clock drives every step, so each number fades and scales in (0.92 → 1, drifting to 1.03) and crossfades into the next; the message just fades in. Reduced motion drops the scaling. Light haptic tick per number.
- **Cancel** (not in Figma, so it's a quiet `Link`-style label in `Content-muted`) and Android back return to Visit Detail without recording. Consent stays logged.
- The overlay stays up under `/recording`'s fade-in and is cleared when Visit Detail regains focus.
- `?countdown=preview` on `/visit/[id]` loops the countdown without consent or navigation (device preview only).

## Recording screen (`RecordingScreen`)

- Header from the visit (name, patient ID), a timer in HH:MM:SS from 00:00:00, the live audio visual, the red "Recording..." label with its mic glyph, and Add Note / End / Pause.
- **Consent guard:** the screen records only when consent is logged for the visit (`useConsent`); otherwise it says consent is needed. Only the browser `?sim=` previews skip this, and they capture nothing.
- `src/lib/recording-session.ts` wraps `expo-audio` (`useAudioRecorder` with metering, polled every 100 ms). Metering −50…−10 dBFS maps to level 0…1; the timer is the recorder's own duration, so it stops while paused. `allowsBackgroundRecording` plus the expo-audio plugin's `enableBackgroundRecording` (app.json) keep it recording in the background; needs a development build.
- `recording-session.web.ts` simulates the level instead (speech comes and goes; `?sim=` fixes it to quiet, speaking or paused, starting at Figma's 00:23:12).
- `AudioLevelVisual` (`src/components/audio-level-visual.tsx`): six 15px gradient dots; above level 0.08 each springs toward its height in the speaking frame, scaled by the level with its own wobble. Reduced motion uses short timings instead of springs.
- **Pause** → "Paused" (muted) and **Resume** (`resume.svg`, drawn to match the Pause icon; Figma has no play icon). **Add Note** opens `AddNoteSheet`; the note keeps the recording time it was opened at and recording continues. **End**, the back arrow and Android back all open `EndRecordingDialog` ("End and save" / "Keep recording"). End stops, saves, generates the summary and `dismissTo`s back to the visit.
- Notes and the finished recording (file URI, duration) live in `src/lib/recording-log.ts`, in memory until there's a backend.
- The screen stays awake while open (`useKeepAwake`, including while paused).
- `SecondaryButton` (design.md `Button - Secondary`) sits next to `PrimaryButton` in `auth-screen.tsx`.

## Visit summary (`SummaryReveal`)

After End and save, `generateSummary(visitId)` (`src/lib/visit-summary.ts`) and Visit Detail switches to frame `293:6174`: "Patient summary" title and the patient row with the status badge. The Summary / Transcript / Notes tabs stay (the frame's plain "Summary" label was dropped at the user's request); the Summary tab shows Reason For Visit, What the patient shared, Assessment, Medications, Follow-up. (The frame repeats "What the patient shared"; it's shown once.)

- **Sample content** lives in `src/lib/sample-summary.ts` (edit it there): a fictional oncology follow-up before chemo cycle 4, about 2–3× the Figma text. It never names the patient or age because any visit can show it. A section has `text`, `bullets` or both. `\u00A0` keeps a date on one line.

- **Skeleton first** (`SummarySkeleton`, `src/components/summary-skeleton.tsx`): for 2 s each section is a gray block (design.md `surface-strong`; `surface-soft` barely shows on white): a marker circle, a heading bar and 2–4 body lines, the last one shorter. Bars match the text sizes with `radius-xs` corners. One shimmer (`useShimmer`, 1.2 s loop) sweeps across all of them in screen coordinates. "Ella is writing your note..." pulses above (`SummarySkeletonStatus`). Each block shares a slot with its real section: when the reveal reaches it, the block fades and the slot grows to the real height, so nothing above moves. The status line's space folds away over 0.3 s as the reveal starts.
- `src/components/summary-reveal.tsx`, one Reanimated clock: after the skeleton, per section (1.05 s) the marker spins 0.6 s, the Figma asterisk marker fills in, the heading fades in, then the body fades in rising 8px; then the "Written by Ella…" note fades in and the Edit / Swipe to Import bar slides up (about 7.95 s with the skeleton). The scroll follows in two steps per section: enough for the marker and heading when it starts, then enough for the body as it appears; a section taller than the screen stops at its heading. The reveal time doesn't depend on text length, so longer content doesn't lengthen it.
- Skeleton and reveal play only while the summary isn't `revealed`; leaving mid-way still counts. Tap anywhere below the tabs to skip, during the skeleton too. Switching tabs mid-reveal also counts as shown. The scroll bar is hidden (`showsVerticalScrollIndicator={false}`). Reduced motion shows it all at once. Edit and the slider stay disabled until the end.
- Badge: Draft while revealing, In-review once shown, Imported after Swipe to Import (`markSummaryShown` keeps Imported).
- `SwipeToConfirm` (`src/components/swipe-to-confirm.tsx`, design.md `Button- Swipe`): gesture-handler pan, confirms past 85%, turns green with a check, then Home after 0.9 s. The thumb's image ignores pointer events so mouse drags work on the web. Screen readers get an `activate` action. Edit → `/edit-summary`.
- `?summary=skeleton|reveal|complete` on `/visit/[id]` shows the sample summary without recording (device preview); `skeleton` holds on the skeleton (`holdSkeleton`).

## Design system

- `design.md` is the source of truth, transcribed from Figma (file `4FqTJq4zxxEAc6bGmCFu1R`). Code tokens live in `src/constants/ella-tokens.ts`; reuse them instead of hard-coding values.
- Values a Figma frame uses that have no token are named constants at the top of the screen file (or `AuthColors` in `src/components/auth-screen.tsx`), with a comment saying where they came from.
- Neue Haas Grotesk and Apercu are licensed and not bundled; `EllaFonts` falls back to Inter.
- The Figma MCP is on the Starter plan and often rate-limited; when it is, build from screenshots the user provides and say so.

## Device preview

With `npx expo start` running, open `http://localhost:8081/preview.html` (`public/preview.html`): phone/tablet frames with status bars and home indicators (phone from Figma; tablet follows iPadOS since Figma has no tablet frames), a **Screen** picker (Home adds a **Variant** dropdown: Not synced, Syncing, Visit list, Sheet expanded; **Recording countdown** loops the countdown, `?screen=countdown`; **Recording: quiet / speaking / paused** use the simulated mic, `?screen=recording-speaking` etc.; **Visit summary: skeleton / revealing / complete**, `?screen=summary-skeleton` etc., with a **Replay animation** button that plays skeleton + reveal), and deep links like `?screen=home&state=list&sheet=expanded#both` (the older `?screen=home%3Fstate%3Dlist` form still works). Files in `public/` ship with web exports.

## Git

- Remote: `https://github.com/kartikpd19/ella-mobile` (branch `main`).
- Commit as `Kartikpd <kartikpd.work@gmail.com>` (set in this repo's local git config).
- No Claude attribution lines in commits or PRs.
