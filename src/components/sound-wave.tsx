import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// Resting heights as a fraction of the full height: tall in the middle, like the Figma icon.
const BARS = [0.4, 0.7, 1, 0.7, 0.4];

type SoundWaveProps = {
  color: string;
  /** Total height of the wave. */
  size?: number;
  barWidth?: number;
  /** When false the bars stop at their resting heights. */
  active?: boolean;
};

/** A small animated "listening" wave. */
export function SoundWave({ color, size = 29, barWidth = 2.5, active = true }: SoundWaveProps) {
  return (
    <View style={[styles.wave, { height: size, gap: barWidth }]} accessibilityElementsHidden importantForAccessibility="no">
      {BARS.map((rest, index) => (
        <Bar key={index} rest={rest} index={index} color={color} size={size} width={barWidth} active={active} />
      ))}
    </View>
  );
}

type BarProps = { rest: number; index: number; color: string; size: number; width: number; active: boolean };

function Bar({ rest, index, color, size, width, active }: BarProps) {
  const scale = useSharedValue(rest);

  useEffect(() => {
    if (!active) {
      cancelAnimation(scale);
      scale.value = withTiming(rest, { duration: 200 });
      return;
    }
    // Each bar bounces between low and its peak, offset so the wave ripples.
    scale.value = withDelay(
      index * 110,
      withRepeat(withTiming(rest < 1 ? Math.min(rest + 0.45, 1) : 0.45, { duration: 420, easing: Easing.inOut(Easing.quad) }), -1, true),
    );
    return () => cancelAnimation(scale);
  }, [active, index, rest, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: scale.value }] }));

  return <Animated.View style={[{ width, height: size, borderRadius: width / 2, backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  wave: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
