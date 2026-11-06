import { Image } from 'expo-image';
import { useEffect, useSyncExternalStore } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HOME_INDICATOR_HEIGHT } from '@/components/auth-screen';
import { EllaColors, EllaFonts, EllaSpacing } from '@/constants/ella-tokens';

const TOAST_MS = 2500;

// Not in Figma; reuses the consent sheet's success circle (semantic-success at 12%).
const SUCCESS_FILL = 'rgba(5,177,105,0.12)';

type Toast = { id: number; message: string };

let current: Toast | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** Shows a short success message above whatever screen is open, including after navigating. */
export function showToast(message: string) {
  current = { id: nextId++, message };
  emit();
  AccessibilityInfo.announceForAccessibility(message);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Rendered once, in the root layout. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const toast = useSyncExternalStore(subscribe, () => current, () => null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      if (current?.id === toast.id) {
        current = null;
        emit();
      }
    }, TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: Math.max(insets.bottom, HOME_INDICATOR_HEIGHT) + EllaSpacing.md }]}>
      {toast && (
        <Animated.View key={toast.id} entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(180)} style={styles.toast}>
          <View style={styles.checkCircle}>
            <Image source={require('@/assets/images/welcome/check.svg')} style={styles.checkIcon} />
          </View>
          <Text style={styles.message}>{toast.message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: EllaSpacing.md,
    right: EllaSpacing.md,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: EllaSpacing.xs,
    paddingVertical: EllaSpacing.sm,
    paddingLeft: EllaSpacing.sm,
    paddingRight: EllaSpacing.md,
    borderRadius: 41,
    backgroundColor: EllaColors.canvas,
    shadowColor: EllaColors.contentInk,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SUCCESS_FILL,
  },
  checkIcon: {
    width: 18,
    height: 18,
  },
  message: {
    fontFamily: EllaFonts.interSemiBold,
    fontSize: 14,
    letterSpacing: 0.84,
    color: EllaColors.contentInk,
  },
});
