import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

// Measured from the Figma frames "iPhone 16 - 51" (quiet, 104:4501) and "iPhone 16 - 38"
// (speaking, 104:4459). `peak` is each bar's height in the speaking frame.
const BARS = [
  { width: 15, peak: 43 },
  { width: 15, peak: 93 },
  { width: 15, peak: 151 },
  { width: 15, peak: 53 },
  { width: 15, peak: 19 },
  { width: 13, peak: 85 },
] as const;
const DOT = 15; // every bar is a 15px dot when quiet
const GAP = 3.153;
const MAX_HEIGHT = 151;
const GRADIENT = ['#EAC7D2', '#96AFFF'] as const;

/** Below this the room counts as quiet and the bars settle back into dots. */
const QUIET_LEVEL = 0.08;

type AudioLevelVisualProps = {
  /** Microphone level, 0 to 1. */
  level: number;
};

/** Soft dots while nobody speaks; they grow into bars that follow the voice. */
export function AudioLevelVisual({ level }: AudioLevelVisualProps) {
  const still = useReducedMotion();

  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {BARS.map((bar, i) => (
        <Bar key={i} width={bar.width} peak={bar.peak} level={level} still={still} />
      ))}
    </View>
  );
}

type BarProps = {
  width: number;
  peak: number;
  level: number;
  still: boolean;
};

function Bar({ width, peak, level, still }: BarProps) {
  const height = useSharedValue(DOT);

  useEffect(() => {
    // Each bar wobbles on its own around the voice level, so the shape keeps moving like speech.
    const amount = level < QUIET_LEVEL ? 0 : Math.min(1, level * (0.6 + 0.6 * Math.random()));
    const target = DOT + (peak - DOT) * amount;
    height.value = still
      ? withTiming(target, { duration: 120 })
      : withSpring(target, { damping: 14, stiffness: 170, mass: 0.6 });
  }, [level, peak, still, height]);

  const style = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <Animated.View style={[styles.bar, { width, borderRadius: width / 2 }, style]}>
      <LinearGradient colors={GRADIENT} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Fixed to the tallest bar so the row never shifts what's around it.
  row: {
    height: MAX_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
  },
  bar: {
    overflow: 'hidden',
  },
});
