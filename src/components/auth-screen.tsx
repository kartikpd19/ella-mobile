import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { EllaColors, EllaFonts } from '@/constants/ella-tokens';

// Values from the Figma login frame (125:7067) that have no token in design.md.
// Shared by the sign-in screens so they stay visually identical.
export const AuthColors = {
  floor: '#F4F4F6', // bottom background fade
  inputBorder: 'rgba(168,172,179,0.7)', // Content-soft at 70%
  buttonIdle: '#E7EBEE',
  buttonIdleText: '#666666',
  hairline: '#DBE2E4', // "or" divider and QR card border
  scanTile: 'rgba(150,175,255,0.24)',
  subtitle: 'rgba(0,0,0,0.59)',
  secondary: 'rgba(0,0,0,0.61)',
  link: '#3C78D0',
} as const;

/** iPhone status bar height in the Figma frames; used as a minimum top inset. */
export const STATUS_BAR_HEIGHT = 47;

/** iPhone home indicator height in the Figma frames; used as a minimum bottom inset. */
export const HOME_INDICATOR_HEIGHT = 34;

/** The soft grey fade at the bottom of the sign-in screens. */
export function AuthBackground() {
  return (
    <LinearGradient
      colors={[AuthColors.floor, AuthColors.floor, 'rgba(255,255,255,0)']}
      locations={[0, 0.49455, 0.87998]}
      start={{ x: 0.355, y: 1 }}
      end={{ x: 0.645, y: 0 }}
      style={styles.floor}
      pointerEvents="none"
    />
  );
}

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Overrides for the pill, e.g. a taller button. */
  style?: StyleProp<ViewStyle>;
};

/** Full-width pill button. Grey while disabled, `button` token when active. */
export function PrimaryButton({ label, onPress, disabled = false, loading = false, style }: PrimaryButtonProps) {
  const active = !disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [styles.button, active && styles.buttonActive, style, pressed && styles.pressed]}>
      {loading ? (
        <ActivityIndicator color={EllaColors.canvas} style={styles.spinner} />
      ) : (
        <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      )}
    </Pressable>
  );
}

type SecondaryButtonProps = Omit<PrimaryButtonProps, 'disabled' | 'loading'>;

/** design.md `Button - Secondary`: outlined pill, same size as PrimaryButton. */
export function SecondaryButton({ label, onPress, style }: SecondaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, styles.buttonSecondary, style, pressed && styles.pressed]}>
      <Text style={[styles.label, styles.labelSecondary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '90%',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14.816,
    borderRadius: 41,
    backgroundColor: AuthColors.buttonIdle,
  },
  buttonActive: {
    backgroundColor: EllaColors.button,
  },
  buttonSecondary: {
    // 1px less padding keeps it the same height as PrimaryButton once the border is added.
    paddingVertical: 13.816,
    borderWidth: 1,
    borderColor: EllaColors.surfaceStrong,
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontFamily: EllaFonts.apercuBold,
    fontSize: 16.933,
    lineHeight: 22.224,
    letterSpacing: -0.3387,
    color: AuthColors.buttonIdleText,
    textAlign: 'center',
  },
  labelActive: {
    color: EllaColors.canvas,
  },
  labelSecondary: {
    color: EllaColors.button,
  },
  // Keeps the button the same height as when it shows a label.
  spinner: {
    height: 22.224,
  },
});
