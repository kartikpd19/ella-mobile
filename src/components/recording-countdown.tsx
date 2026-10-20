import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, BackHandler, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HOME_INDICATOR_HEIGHT } from '@/components/auth-screen';
import { EllaColors, EllaFonts, EllaSpacing } from '@/constants/ella-tokens';

// Measured from the Figma frames "iPhone 16 - 65…68" (104:5359, 104:5362, 104:5365, 104:5368).
const Frame = {
  numberSize: 132.441,
  numberTracking: 7.9464,
  messageSize: 20.842,
} as const;

export const COUNTDOWN_MESSAGE = 'Wishing you a great session! 😊';

const NUMBERS = [3, 2, 1] as const;
const NUMBER_MS = 800;
const MESSAGE_MS = 1200;
const FADE_IN_MS = 300;
const FADE_OUT_MS = 200; // overlaps the next step, so each number crossfades into the next
const MESSAGE_FADE_MS = 500;
const MESSAGE_START = NUMBERS.length * NUMBER_MS;
const TOTAL_MS = MESSAGE_START + MESSAGE_MS;

const easeOut = Easing.out(Easing.cubic);

/** 0 → 1 between `from` and `to` on the countdown clock, eased. */
function ramp(t: number, from: number, to: number) {
  'worklet';
  return easeOut(Math.min(Math.max((t - from) / (to - from), 0), 1));
}

type RecordingCountdownProps = {
  /** Called once the final message has shown. Recording starts here, never earlier. */
  onDone: () => void;
  /** Back to Visit Detail without recording. */
  onCancel: () => void;
};

/** Full-screen 3-2-1 shown after consent, before recording starts (Figma 104:5359–104:5368). */
export function RecordingCountdown({ onDone, onCancel }: RecordingCountdownProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const clock = useSharedValue(0);
  // Latest callbacks for the timers, which are set up once on mount.
  const callbacks = useRef({ onDone, onCancel });
  useEffect(() => {
    callbacks.current = { onDone, onCancel };
  });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function stop() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    cancelAnimation(clock);
  }

  function cancel() {
    stop();
    callbacks.current.onCancel();
  }

  useEffect(() => {
    clock.value = withTiming(TOTAL_MS, { duration: TOTAL_MS, easing: Easing.linear });

    NUMBERS.forEach((n, i) => {
      timers.current.push(
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          AccessibilityInfo.announceForAccessibility(i === 0 ? `Recording starts in ${n}` : String(n));
        }, i * NUMBER_MS),
      );
    });
    timers.current.push(
      setTimeout(() => AccessibilityInfo.announceForAccessibility(COUNTDOWN_MESSAGE), MESSAGE_START),
      setTimeout(() => callbacks.current.onDone(), TOTAL_MS),
    );

    // Android back cancels the countdown instead of leaving the screen mid-way.
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      cancel();
      return true;
    });

    return () => {
      stop();
      back.remove();
    };
    // Runs once: the countdown plays from mount to onDone or cancel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const screenStyle = useAnimatedStyle(() => ({ opacity: ramp(clock.value, 0, FADE_IN_MS) }));
  const messageStyle = useAnimatedStyle(() => ({
    opacity: ramp(clock.value, MESSAGE_START, MESSAGE_START + MESSAGE_FADE_MS),
  }));

  return (
    <Animated.View style={[styles.screen, screenStyle]} accessibilityViewIsModal>
      {NUMBERS.map((n, i) => (
        <CountdownNumber key={n} value={n} start={i * NUMBER_MS} clock={clock} still={reduceMotion} />
      ))}
      <Animated.View style={[styles.center, messageStyle]} pointerEvents="none">
        <Text style={styles.message}>{COUNTDOWN_MESSAGE}</Text>
      </Animated.View>

      {/* Not in the Figma frames: a quiet way out before anything is recorded. */}
      <Pressable
        onPress={cancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel recording"
        hitSlop={12}
        style={[styles.cancel, { bottom: Math.max(insets.bottom, HOME_INDICATOR_HEIGHT) + EllaSpacing.xl }]}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </Animated.View>
  );
}

type CountdownNumberProps = {
  value: number;
  start: number;
  clock: SharedValue<number>;
  still: boolean;
};

function CountdownNumber({ value, start, clock, still }: CountdownNumberProps) {
  const style = useAnimatedStyle(() => {
    const t = clock.value;
    const shown = ramp(t, start, start + FADE_IN_MS);
    const gone = ramp(t, start + NUMBER_MS, start + NUMBER_MS + FADE_OUT_MS);
    // Scales up slightly as it fades in, then keeps drifting a touch larger until it fades out.
    const scale = still ? 1 : 0.92 + 0.08 * shown + 0.03 * ramp(t, start + FADE_IN_MS, start + NUMBER_MS + FADE_OUT_MS);
    return { opacity: shown * (1 - gone), transform: [{ scale }] };
  });

  return (
    <Animated.View style={[styles.center, style]} pointerEvents="none">
      <Text style={styles.number}>{value}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: EllaColors.canvas,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: EllaSpacing.xl,
  },
  number: {
    fontFamily: EllaFonts.interMedium,
    fontSize: Frame.numberSize,
    letterSpacing: Frame.numberTracking,
    color: EllaColors.button,
    textAlign: 'center',
  },
  message: {
    fontFamily: EllaFonts.interSemiBold,
    fontSize: Frame.messageSize,
    color: EllaColors.button,
    textAlign: 'center',
  },
  cancel: {
    position: 'absolute',
    alignSelf: 'center',
  },
  // design.md `Link` (14 / 16, Medium) in `Content-muted`, so it stays out of the way.
  cancelText: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 14,
    lineHeight: 16,
    color: EllaColors.contentMuted,
  },
});
