import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import {
  AppState,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBackground, AuthColors, PrimaryButton, STATUS_BAR_HEIGHT } from '@/components/auth-screen';
import { EllaLogo } from '@/components/ella-logo';
import { EllaColors, EllaFonts, EllaRadius, EllaSpacing } from '@/constants/ella-tokens';
import { startSync } from '@/lib/sync-state';

const STEPS = ['Open Ella on your computer', 'Go to settings → connect phone', 'Scan the QR code shown'];

// Scanner frame geometry, measured from the Figma frame (390pt wide).
const TITLE_TOP = 63; // below the status bar
const TITLE_HEIGHT = 29;
const VIEWFINDER_GAP = 22;
const VIEWFINDER_MAX = 356;
const CORNER = 38;
const CORNER_WIDTH = 5;

// Overlay colors on the camera feed (not in design.md).
const Scrim = {
  dim: 'rgba(0,0,0,0.5)',
  card: 'rgba(0,0,0,0.55)',
  stepBadge: 'rgba(255,255,255,0.24)',
  outline: 'rgba(255,255,255,0.72)',
} as const;

/**
 * The scanner opens from two places: the login screen (QR sign-in) and Home's
 * "Sync now" (`?from=home`), which links an already signed-in device.
 */
type Origin = 'login' | 'home';

function goBack(origin: Origin) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(origin === 'home' ? '/home' : '/login');
  }
}

export default function ScanScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const origin: Origin = from === 'home' ? 'home' : 'login';
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const askedOnce = useRef(false);

  // Ask the first time the screen opens; afterwards the user decides from the fallback screen.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain && !askedOnce.current) {
      askedOnce.current = true;
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Pick up a permission change made in Settings when the app comes back to the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') getPermission();
    });
    return () => subscription.remove();
  }, [getPermission]);

  if (!permission) {
    return <View style={styles.camera} />;
  }

  if (!permission.granted) {
    return <PermissionNeeded origin={origin} canAskAgain={permission.canAskAgain} onAllow={requestPermission} />;
  }

  return <Scanner origin={origin} />;
}

function Scanner({ origin }: { origin: Origin }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const handled = useRef(false);

  const topInset = Math.max(insets.top, STATUS_BAR_HEIGHT);
  const titleTop = topInset + TITLE_TOP;
  const size = Math.min(width - 2 * 17, VIEWFINDER_MAX);
  const left = (width - size) / 2;
  const top = titleTop + TITLE_HEIGHT + VIEWFINDER_GAP;

  // UI-only flow: any QR code is accepted. The camera fires repeatedly while a code is
  // in view, so only the first scan navigates.
  function handleScan(_result: BarcodeScanningResult) {
    if (handled.current) return;
    handled.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (origin === 'home') {
      // Already signed in: return to the same Home screen (keeps the doctor's name),
      // which shows the syncing state and then the visit list.
      startSync();
      goBack('home');
    } else {
      router.dismissAll();
      router.replace('/home');
    }
  }

  return (
    <View style={styles.camera}>
      <StatusBar style="light" />
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleScan}
      />

      {/* Dim everything except the viewfinder square. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.dim, { top: 0, left: 0, right: 0, height: top }]} />
        <View style={[styles.dim, { top: top + size, left: 0, right: 0, bottom: 0 }]} />
        <View style={[styles.dim, { top, left: 0, width: left, height: size }]} />
        <View style={[styles.dim, { top, left: left + size, right: 0, height: size }]} />

        <View style={[styles.viewfinder, { top, left, width: size, height: size }]}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      <Text style={[styles.title, { top: titleTop }]} accessibilityRole="header">
        Scan QR code
      </Text>

      <View style={[styles.below, { top: top + size + 26 }]}>
        <View style={styles.steps}>
          {STEPS.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Signing in another way only makes sense before sign-in. */}
        {origin === 'login' && (
          <Pressable
            onPress={() => goBack(origin)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}>
            <Text style={styles.outlineLabel}>Use institute login instead</Text>
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={() => goBack(origin)}
        accessibilityRole="button"
        accessibilityLabel="Close scanner"
        hitSlop={8}
        style={({ pressed }) => [styles.close, { top: topInset }, pressed && styles.pressed]}>
        <Image source={require('@/assets/images/scan/close.svg')} style={styles.icon} />
      </Pressable>
    </View>
  );
}

type PermissionNeededProps = { origin: Origin; canAskAgain: boolean; onAllow: () => void };

function PermissionNeeded({ origin, canAskAgain, onAllow }: PermissionNeededProps) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, STATUS_BAR_HEIGHT);
  const isWeb = Platform.OS === 'web';
  const code = origin === 'home' ? 'QR code' : 'sign-in QR code';
  const backLabel = origin === 'home' ? 'Back to Home' : 'Back to login';

  // Browsers can't open their own site settings, so the web build retries the prompt instead.
  const message = isWeb
    ? `Ella needs your camera to scan the ${code}. Allow camera access in your browser’s site settings, then try again.`
    : canAskAgain
      ? `Ella needs your camera to scan the ${code} shown on your computer.`
      : `Ella needs your camera to scan the ${code}. You can turn on camera access in Settings.`;
  const action = !isWeb && !canAskAgain ? 'Open Settings' : isWeb ? 'Try again' : 'Allow camera access';
  const onPress = !isWeb && !canAskAgain ? () => Linking.openSettings() : onAllow;

  return (
    <View style={[styles.permissionScreen, { paddingTop: topInset + 48 }]}>
      <StatusBar style="dark" />
      <AuthBackground />
      <EllaLogo />

      <View style={styles.permissionColumn}>
        <View style={styles.permissionText}>
          <Text style={styles.permissionTitle}>Allow camera access</Text>
          <Text style={styles.permissionBody}>{message}</Text>
        </View>

        <View style={styles.buttonWrap}>
          <PrimaryButton label={action} onPress={onPress} />
        </View>

        <Text style={styles.backLink} onPress={() => goBack(origin)} accessibilityRole="link">
          {backLabel}
        </Text>
      </View>

      <Pressable
        onPress={() => goBack(origin)}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        hitSlop={8}
        style={({ pressed }) => [styles.close, { top: topInset + 4 }, pressed && styles.pressed]}>
        <Image source={require('@/assets/images/otp/arrow-left.svg')} style={styles.icon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    backgroundColor: EllaColors.contentInk,
  },
  dim: {
    position: 'absolute',
    backgroundColor: Scrim.dim,
  },
  viewfinder: {
    position: 'absolute',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: EllaColors.ellaBlue,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: EllaRadius.md,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: EllaRadius.md,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: EllaRadius.md,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: EllaRadius.md,
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontFamily: EllaFonts.displayMedium,
    fontSize: 24,
    color: EllaColors.canvas,
    textAlign: 'center',
  },
  below: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 23,
  },
  steps: {
    width: 323,
    maxWidth: '84%',
    padding: EllaSpacing.xl,
    gap: EllaSpacing.md,
    borderRadius: EllaRadius.lg,
    backgroundColor: Scrim.card,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: EllaSpacing.sm,
  },
  stepBadge: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: EllaRadius.full,
    backgroundColor: Scrim.stepBadge,
  },
  stepNumber: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 14,
    color: EllaColors.canvas,
  },
  stepText: {
    flex: 1,
    fontFamily: EllaFonts.interRegular,
    fontSize: 16,
    lineHeight: 20,
    color: EllaColors.canvas,
  },
  // Light-on-dark outline pill from the scanner frame; not one of the design-system button variants.
  outlineButton: {
    height: 46,
    paddingHorizontal: EllaSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Scrim.outline,
    borderRadius: EllaRadius.full,
  },
  outlineLabel: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 14,
    lineHeight: 20,
    color: EllaColors.canvas,
  },
  close: {
    position: 'absolute',
    left: EllaSpacing.lg,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  pressed: {
    opacity: 0.6,
  },
  permissionScreen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: EllaColors.canvas,
  },
  permissionColumn: {
    width: '100%',
    maxWidth: 393,
    marginTop: 34,
    alignItems: 'center',
    gap: 14,
  },
  permissionText: {
    width: 330,
    maxWidth: '92%',
    gap: EllaSpacing.xxs,
  },
  permissionTitle: {
    fontFamily: EllaFonts.displayMedium,
    fontSize: 24,
    color: EllaColors.contentInk,
    textAlign: 'center',
  },
  permissionBody: {
    fontFamily: EllaFonts.displayRoman,
    fontSize: 16,
    color: AuthColors.subtitle,
    textAlign: 'center',
  },
  buttonWrap: {
    alignSelf: 'stretch',
    paddingHorizontal: EllaSpacing.xl,
    paddingVertical: EllaSpacing.md,
  },
  backLink: {
    fontFamily: EllaFonts.displayMedium,
    fontSize: 14,
    lineHeight: 20,
    color: AuthColors.link,
    textDecorationLine: 'underline',
  },
});
