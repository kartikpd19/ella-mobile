# Ella Design System

Source: Figma — [Ella Extended product › Ella_design.MD](https://www.figma.com/design/4FqTJq4zxxEAc6bGmCFu1R/Ella-Extended-product?node-id=108-5879) (node `108:5879`).
Pulled 2026-10-14 via the Figma MCP. Token names are copied verbatim from Figma, including their casing and spacing.

> **How conflicts were resolved (2026-10-14).** Where a Figma label disagreed with what was drawn, this file now keeps one value per token:
> - **Colors:** the color actually painted in the design.
> - **Spacing:** the illustrated bars, which form a clean scale.
> - **Typography:** the written spec on each label (the sample text was left at default line heights).
> - **Radius:** the written value.
>
> The overridden Figma labels are listed under [Figma labels to fix](#figma-labels-to-fix) so the file can be brought in line.

> **Sync status:** names, labels and descriptions were re-read from Figma on the second pass. That pass was rate-limited (Starter plan), so painted fills and styles were last read on the first pass.

---

## 1. Colors

### Figma variables

These are the only values defined as real Figma **variables** in this frame (everything else is a documented swatch, not a variable).

| Variable | Value |
| --- | --- |
| `Accents/Blue` | `#0088FF` |
| `Accents/Purple` | `#CB30E0` |
| `Accents/Pink` | `#FF2D55` |
| `Accents/Yellow` | `#FFCC00` |

### Brand and Accent

| Token | Value | Usage (from Figma) |
| --- | --- | --- |
| `ELLA gradient` | `linear-gradient(114.16deg, #5A7AF0 4.10%, #D2708E 100%)` | Hero moments and highlights |
| `Ella Blue` | `#1F54E1` | — |
| `accent-rose` | `#D7708A` | — |
| `button` | `#232A30` | — |

`Ella Blue`, `accent-rose` and `button` come from their labels; their swatch fills haven't been read yet (rate limit). `Ella Blue` and `button` match fills used in the components.

### Surface

| Token | Value | Usage (from Figma) |
| --- | --- | --- |
| `canvas` | `#FFFFFF` | Default page floor. |
| `surface-strong` | `#E0E2E8` | Inputs, search, secondary buttons. |
| `surface-soft` | `#F7F7F7` | Cards, alternating sections. |
| `surface-accent` | `#EBBCF3` | — |

### Content

| Token | Value |
| --- | --- |
| `Content- ink` | `#000000` |
| `Content-body` | `#2B2B2B` |
| `Content-muted` | `#7C828A` |
| `Content-soft` | `#A8ACB3` |

### Sentiments

| Token | Value | Usage (from Figma) |
| --- | --- | --- |
| `semantic-success` | `#05B169` | Saved, synced, note signed. |
| `semantic-error` | `#D9002B` | Errors, destructive actions. |
| `semantic-warning` | `#F17A29` | Needs review, missing info. |

### Off-token colors used in components

These appear in component styles but are not in the palette above.

| Value | Where |
| --- | --- |
| `#0B0E11` | `Button - Pressed` background |
| `#ED0C09` | `Button - Delete` background (palette has `semantic-error` `#D9002B`) |
| `#4C6AFF` | `Button - Link` text |
| `#858CA3` | `Button - disable` text |
| `#059655` | Imported badge text, `Complete` status ring |
| `#887EE2` | `Arrived` status ring |
| `#808080` | `No-show` status ring |
| `#CEC1E1` | OTP cell border |
| `#D1D1D2` | Spec-card border (documentation frames) |

---

## 2. Typography

Families in use:
- **Neue Haas Grotesk Display Pro** — `65 Medium`, `55 Roman` (headings)
- **Inter** — Regular, Medium, Bold (body, UI)
- **Roboto Mono** — Medium (OTP digits)
- **Apercu** — Bold (button labels)

| Token | Size / line height | Weight | Family | Usage |
| --- | --- | --- | --- | --- |
| `Headline` | 28px / 38px | Medium | Neue Haas Grotesk Display Pro 65 Medium | Page title |
| `Title - lg` | 22px / 28px | Regular | Neue Haas Grotesk Display Pro 55 Roman | Top app bar, section titles |
| `Title` | 16px / 24px | Medium | Neue Haas Grotesk Display Pro 65 Medium | Card titles, list headers |
| `Body` | 16px / 24px | Regular | Inter | Main reading text |
| `Body-sm` | 16px / 20px | Regular | Inter | Secondary text, description |
| `Button` | 14px / 20px | Medium | Inter | All buttons |
| `Label` | 14px / 20px | Regular | Inter | Chips, tabs |
| `Link` | 14px / 16px | Medium | Inter | All links |
| `caption` | 12px / 16px | Regular | Inter | Helper text, timestamp, metadata |

The Inter samples in Figma also use −0.9971px letter spacing; the labels don't specify one.

---

## 3. Spacing

| Token | Value |
| --- | --- |
| `Spacing- xxs` | 4px |
| `Spacing- xs` | 8px |
| `Spacing- sm` | 12px |
| `Spacing- md` | 16px |
| `Spacing- lg` | 20px |
| `Spacing- xl` | 24px |
| `Spacing- xxl` | 32px |
| `Spacing- section` | 40px |

---

## 4. Border radius

| Token | Value |
| --- | --- |
| `radius-xs` | 4px |
| `radius-sm` | 8px |
| `radius-md` | 12px |
| `radius-lg` | 16px |
| `radius-xl` | 28px |
| `radius-full` | 999px |

---

## 5. Components

### Buttons

All pill buttons: width 171px, vertical padding 14.816px (height ≈ 52.6px), radius 41px, label Apercu Bold 16.933px / 22.224px, ls −0.3387px, centered.

| Variant (Figma name) | Background | Border | Text |
| --- | --- | --- | --- |
| `Button - Active` | `#232A30` | — | `#FFFFFF` |
| `Button - Pressed` | `#0B0E11` | — | `rgba(255,255,255,0.72)` |
| `Button - disable` | `#E0E2E8` | — | `#858CA3` |
| `Button - Secondary` | transparent | 1px `#E0E2E8` | `#232A30` |
| `Button - Delete` | `#ED0C09` | — | `#FFFFFF` |
| `Button - Link` ("Link more") | none | — | `#4C6AFF`, underlined |

Other button patterns:
- **`Button - Icon`**: 64×64 `ant-design:pause-circle-filled` icon on a light grey circle.
- **`Button- Swipe`** ("Swipe to Import"): 175.66×53px track, `#232A30`, radius 26.5px, padding 3.786 / 30.286 / 4.543 / 6.057px (T/R/B/L), gap 5.3px. Thumb: 44.67px white circle (radius 22.336px) with a 25.74px `boxicons:chevrons-right` icon. Label: Inter Regular 10.6px, ls 0.636px, white.
- **`Button - Icon _lg`** ("DONE"): 103×70px dark pill (`#232A30`-family) with a 16.4×11.7px white checkmark.

`Button - Pressed` is the pressed state of `Button - Active`. The button cards still carry the placeholder description "A brief description about the color".

**Outside the button set — scanner screen (frame `125:7170`):** "Use institute login instead" is a light-on-dark outline pill drawn over the camera: transparent fill, 1px white border at ~72% opacity, radius `radius-full`, white Inter Medium 14px label, ~46px tall. It isn't one of the variants above; if it should become one (e.g. an inverted `Button - Secondary`), it needs adding to the Figma button set.

### Badges — `Recording Status`

Component: `Recording Status` (variant prop `Property 1`). Height 24px, padding 4px 8px, radius 16px, gap 4px, 16px status icon, label Inter Medium 16px.

| Figma name | Variant | Background | Border | Text | Label shown | Meaning (from Figma) |
| --- | --- | --- | --- | --- | --- | --- |
| `Status-Draft` | `Draft` | `#F3F4F8` | — | `#3A4050` | Draft | Saved but not submitted. Only visible to the owner. |
| `Status-In Progress` | `In Progress` | `#FCEFD4` | — | `#F17A29` | In Progress | Actively being worked on or processing. |
| `Status-In-Review` | `In-review` | `#F3F0FF` | — | `#1F54E1` | In-review | Submitted and waiting on approval |
| `Status-imported` | `Completed` | `#ECFDF3` | — | `#059655` | Imported | Successfully brought in and ready to use. |
| `Status-canceled` | `Canceled` | `rgba(212,213,218,0.55)` | 1px dashed `rgba(0,0,0,0.4)` | `rgba(58,64,80,0.62)` | Canceled (no icon) | Stopped before completion. No further action. |

Rows follow the new order in Figma (Canceled moved to the end). The card for the `Completed` variant is named `Status-imported`, matching its "Imported" label.

The nested `Status` icon component has variants `Draft`, `In progress`, `In review`, `Completed`.

### Status ring — `status-color ring`

30×30px container with a 4×15px vertical bar, radius 35px, centered.

| Status | Bar color |
| --- | --- |
| `Scheduled` (shown as "Schedule") | `Accents/Blue` `#0088FF` |
| `Arrived` | `#887EE2` |
| `Waiting` | `Accents/Purple` `#CB30E0` |
| `Rooming` | `Accents/Pink` `#FF2D55` |
| `Consultation` | `Accents/Yellow` `#FFCC00` |
| `Complete` | `#059655` |
| `No-show` | `#808080` |

### Input field

- **Label**: Inter Bold 14px, ls 0.84px, `#000000`; 19px gap to the input.
- **Input**: 330×37px, background `#FFFFFF`, radius 12px (`radius-md`), padding 16px.
  - Default border: 1px `#A8ACB3` (`Content-soft`)
  - Focused border: 1px `#1F54E1` (`Ella Blue`)
- **Placeholder**: Inter Medium 14px, ls 0.84px, `#7C828A` (`Content-muted`).

### Search

Background `#E0E2E8` (`surface-strong`), radius 53px (pill), padding 8px 16px, gap 8px, 24px search icon. Placeholder "Search patient name": Inter Medium 14px, ls 0.84px, `#2B2B2B` (`Content-body`).

### OTP / code entry

- **Heading**: Neue Haas Grotesk Display Pro 65 Medium 24px, `#000000`, centered.
- **Cells**: 6 × (54×69px), 5px gap, background `#FFFFFF`, 1px `#CEC1E1` border, radius 12px. Variants: `Default` (empty) and `text entered`.
  - Digit: Roboto Mono Medium 35.048px, centered; `#000000` when entered, `rgba(0,0,0,0.69)` on the active cell.
- **Help link**: "Where can I find my access code?" — Neue Haas Grotesk Display Pro 55 Roman 16px, `rgba(0,0,0,0.61)`, centered.
- Vertical gap between groups: 23px.

---

## Figma labels to fix

These Figma labels disagree with the values this file now uses. Updating them keeps Figma and code in sync.

| Item | Label in Figma | Value used here |
| --- | --- | --- |
| `ELLA gradient` | `#1E4DFF → #7A3CFF` | `#5A7AF0 → #D2708E` (painted) |
| `surface-strong` | `#EEF0F3` | `#E0E2E8` (painted) |
| `semantic-warning` | `#F4B000` | `#F17A29` (painted) |
| `Spacing- sm` | 8px | 12px |
| `Spacing- md` | 12px | 16px |
| `Spacing- lg` | 16px | 20px |
| `Spacing- xl` | 20px | 24px |
| `Spacing- xxl` | 24px | 32px |
| `radius-xl` sample shape | drawn at 16px | 28px (label) |
| Type samples | 24px line height on all Inter styles; `Headline` 36px; `Button` Semi Bold; `caption` Medium | the labelled spec in section 2 |

## Open questions for design

1. `Body-sm` is labelled 16px, the same as `Body`. Was 14px intended?
2. Buttons are built with Apercu Bold 16.93px, not the `Button` text token (Inter 14px / 20px Medium). Which one is correct?
3. Destructive button `#ED0C09` vs `semantic-error` `#D9002B`; link `#4C6AFF` vs `Ella Blue` `#1F54E1`; imported/complete `#059655` vs `semantic-success` `#05B169`. Should these be merged?
4. Only the four `Accents/*` colors are Figma variables. Should the rest of the palette become variables too?
