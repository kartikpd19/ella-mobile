import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { EllaColors, EllaFonts } from '@/constants/ella-tokens';

// Measured from "Swipe to Import" in the Figma frame "iPhone 16 - 79" (293:6256).
const TRACK_WIDTH = 245;
const TRACK_HEIGHT = 67;
const THUMB_WIDTH = 49;
const THUMB_HEIGHT = 52;
const THUMB_INSET = 14.5; // track padding (6.5) + inner padding (8)
const TRAVEL = TRACK_WIDTH - THUMB_INSET * 2 - THUMB_WIDTH;
const CONFIRM_AT = 0.85; // share of the track to drag before it counts

type SwipeToConfirmProps = {
  label: string;
  doneLabel: string;
  disabled?: boolean;
  onConfirm: () => void;
};

/** design.md `Button- Swipe`: drag the thumb to the end to confirm. */
export function SwipeToConfirm({ label, doneLabel, disabled = false, onConfirm }: SwipeToConfirmProps) {
  const [done, setDone] = useState(false);
  const x = useSharedValue(0);

  function confirm() {
    if (done) return;
    setDone(true);
    onConfirm();
  }

  const pan = Gesture.Pan()
    .enabled(!disabled && !done)
    .onUpdate((e) => {
      x.value = Math.min(Math.max(e.translationX, 0), TRAVEL);
    })
    .onEnd(() => {
      if (x.value >= TRAVEL * CONFIRM_AT) {
        x.value = withTiming(TRAVEL, { duration: 150, easing: Easing.out(Easing.cubic) });
        scheduleOnRN(confirm);
      } else {
        x.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0, TRAVEL * 0.6], [1, 0], 'clamp') }));

  return (
    <View
      style={[styles.track, done && styles.trackDone, disabled && styles.disabled]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={done ? doneLabel : label}
      accessibilityHint="Swipe right to confirm"
      accessibilityState={{ disabled }}
      accessibilityActions={[{ name: 'activate', label }]}
      onAccessibilityAction={() => {
        if (disabled || done) return;
        x.set(withTiming(TRAVEL, { duration: 150 }));
        confirm();
      }}>
      {done ? (
        <Text style={[styles.label, styles.doneLabel]}>{doneLabel}</Text>
      ) : (
        <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
      )}
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.thumb, thumbStyle]} hitSlop={8}>
          {/* pointerEvents none: on the web the <img> would start a native image drag instead. */}
          <View pointerEvents="none">
            <Image
              source={done ? require('@/assets/images/welcome/check.svg') : require('@/assets/images/summary/chevrons.svg')}
              style={done ? styles.check : styles.chevrons}
            />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: 48,
    justifyContent: 'center',
    backgroundColor: EllaColors.button,
  },
  trackDone: {
    backgroundColor: EllaColors.semanticSuccess,
  },
  disabled: {
    opacity: 0.6,
  },
  thumb: {
    position: 'absolute',
    left: THUMB_INSET,
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: 29.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EllaColors.canvas,
  },
  chevrons: {
    width: 29.089,
    height: 29.089,
  },
  check: {
    width: 24,
    height: 24,
  },
  label: {
    marginLeft: THUMB_INSET + THUMB_WIDTH + 7,
    fontFamily: EllaFonts.interRegular,
    fontSize: 14,
    letterSpacing: 0.84,
    color: EllaColors.canvas,
  },
  doneLabel: {
    fontFamily: EllaFonts.interSemiBold,
  },
});
