/**
 * Ella design tokens, transcribed from design.md (Figma "Ella_design.MD", node 108:5879).
 * Keys mirror the Figma token names. Values follow design.md's conflict resolution:
 * painted colors, illustrated spacing, labelled radius.
 */

export const EllaColors = {
  // Figma variables
  accentsBlue: '#0088FF', // Accents/Blue
  accentsPurple: '#CB30E0', // Accents/Purple
  accentsPink: '#FF2D55', // Accents/Pink
  accentsYellow: '#FFCC00', // Accents/Yellow

  // Brand and Accent
  ellaBlue: '#1F54E1', // Ella Blue
  accentRose: '#D7708A', // accent-rose
  button: '#232A30', // button

  // Surface
  canvas: '#FFFFFF', // canvas
  surfaceStrong: '#E0E2E8', // surface-strong
  surfaceSoft: '#F7F7F7', // surface-soft
  surfaceAccent: '#EBBCF3', // surface-accent

  // Content
  contentInk: '#000000', // Content- ink
  contentBody: '#2B2B2B', // Content-body
  contentMuted: '#7C828A', // Content-muted
  contentSoft: '#A8ACB3', // Content-soft

  // Sentiments
  semanticSuccess: '#05B169', // semantic-success
  semanticError: '#D9002B', // semantic-error
  semanticWarning: '#F17A29', // semantic-warning
} as const;

export const EllaSpacing = {
  xxs: 4, // Spacing- xxs
  xs: 8, // Spacing- xs
  sm: 12, // Spacing- sm
  md: 16, // Spacing- md
  lg: 20, // Spacing- lg
  xl: 24, // Spacing- xl
  xxl: 32, // Spacing- xxl
  section: 40, // Spacing- section
} as const;

export const EllaRadius = {
  xs: 4, // radius-xs
  sm: 8, // radius-sm
  md: 12, // radius-md
  lg: 16, // radius-lg
  xl: 28, // radius-xl
  full: 999, // radius-full
} as const;

/**
 * Font families. Neue Haas Grotesk Display Pro and Apercu are licensed fonts that
 * aren't bundled yet, so they fall back to Inter. Once their files are added under
 * assets/fonts and loaded, point these entries at the real family names.
 */
export const EllaFonts = {
  displayMedium: 'Inter_500Medium', // Neue Haas Grotesk Display Pro 65 Medium
  displayRoman: 'Inter_400Regular', // Neue Haas Grotesk Display Pro 55 Roman
  apercuBold: 'Inter_700Bold', // Apercu Bold
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interBold: 'Inter_700Bold',
  monoMedium: 'RobotoMono_500Medium', // Roboto Mono Medium (OTP digits)
} as const;
