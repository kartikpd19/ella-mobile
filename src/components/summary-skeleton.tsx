import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View, type DimensionValue } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { EllaColors, EllaFonts, EllaRadius } from '@/constants/ella-tokens';

const SHIMMER_MS = 1200;
const BAND = 140; // width of the moving highlight
const SHIMMER = ['rgba(255,255,255,0)', 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0)'] as const;

// Bars sized to the summary's text styles, so the skeleton sits where the text will be.
const MARKER = 24; // the section marker
const HEADING_BAR = 14; // 14px heading on a 17px line
const LINE_BAR = 16; // 16px body on a 22px line
const LINE_GAP = 6;

/** One shimmer clock for every skeleton bar, so the highlight sweeps across them together. */
export function useShimmer(active: boolean): SharedValue<number> {
  const shimmer = useSharedValue(0);
  useEffect(() => {
    if (!active) return;
    shimmer.value = withRepeat(withTiming(1, { duration: SHIMMER_MS, easing: Easing.inOut(Easing.ease) }), -1);
    return () => cancelAnimation(shimmer);
  }, [active, shimmer]);
  return shimmer;
}

type SummarySkeletonProps = {
  /** Body line widths; the last one is shorter so it reads like real text. */
  lines: DimensionValue[];
  headingWidth: DimensionValue;
  shimmer: SharedValue<number>;
  /** Distance from the screen's left edge to the marker and to the text column. */
  markerX: number;
  textX: number;
  /** Space between the marker and the text, as in the real section. */
  gap: number;
};

/** Placeholder for one summary section: marker circle, heading bar and 2–4 body lines. */
export function SummarySkeleton({ lines, headingWidth, shimmer, markerX, textX, gap }: SummarySkeletonProps) {
  return (
    <View style={[styles.block, { gap }]}>
      <Bone style={styles.marker} shimmer={shimmer} x={markerX} />
      <View style={styles.text}>
        <Bone style={[styles.heading, { width: headingWidth }]} shimmer={shimmer} x={textX} />
        <View style={styles.lines}>
          {lines.map((width, i) => (
            <Bone key={i} style={[styles.line, { width }]} shimmer={shimmer} x={textX} />
          ))}
        </View>
      </View>
    </View>
  );
}

type BoneProps = {
  style: object;
  shimmer: SharedValue<number>;
  x: number;
};

/** A gray bar with the shared highlight passing through it. */
function Bone({ style, shimmer, x }: BoneProps) {
  const { width: screenWidth } = useWindowDimensions();
  const bandStyle = useAnimatedStyle(() => ({
    // Screen coordinates, shifted by this bar's left edge, so every bar shows the same sweep.
    transform: [{ translateX: -BAND + shimmer.value * (screenWidth + BAND) - x }],
  }));

  return (
    <View style={[styles.bone, style]}>
      <Animated.View style={[styles.band, bandStyle]}>
        <LinearGradient colors={SHIMMER} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

/** "Ella is writing your note..." with a gentle pulse, shown above the skeleton. */
export function SummarySkeletonStatus() {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.Text style={[styles.status, style]} accessibilityLiveRegion="polite">
      Ella is writing your note...
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  block: {
    flexDirection: 'row',
  },
  text: {
    flex: 1,
    gap: 7,
  },
  lines: {
    gap: LINE_GAP,
    // Centers each bar on its 22px line, matching the body text.
    paddingTop: (22 - LINE_BAR) / 2,
  },
  // design.md `surface-strong`: `surface-soft` (#F7F7F7) barely shows on the white canvas.
  bone: {
    overflow: 'hidden',
    backgroundColor: EllaColors.surfaceStrong,
  },
  band: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: BAND,
  },
  marker: {
    width: MARKER,
    height: MARKER,
    marginTop: -3.5,
    borderRadius: MARKER / 2,
  },
  heading: {
    height: HEADING_BAR,
    marginTop: (17 - HEADING_BAR) / 2,
    borderRadius: EllaRadius.xs,
  },
  line: {
    height: LINE_BAR,
    borderRadius: EllaRadius.xs,
  },
  // design.md `Label` size in `Ella Blue`.
  status: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: 0.84,
    color: EllaColors.ellaBlue,
  },
});
