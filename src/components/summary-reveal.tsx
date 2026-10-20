import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
  type LayoutRectangle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HOME_INDICATOR_HEIGHT } from '@/components/auth-screen';
import { SummarySkeleton, SummarySkeletonStatus, useShimmer } from '@/components/summary-skeleton';
import { SwipeToConfirm } from '@/components/swipe-to-confirm';
import { EllaColors, EllaFonts, EllaSpacing } from '@/constants/ella-tokens';
import type { SummarySection } from '@/lib/visit-summary';

// Measured from the Figma frame "iPhone 16 - 79" (293:6174); no design.md token for these.
const Frame = {
  heading: '#000000',
  markerBorder: '#DCE2FD',
  rail: '#F1F1F1',
  divider: 'rgba(0,0,0,0.08)',
  noteFill: 'rgba(150,175,255,0.35)',
  noteText: '#202D56',
  editFill: '#E7EBEE',
  editText: '#070709',
  fade: ['rgba(255,255,255,0)', '#FFFFFF'] as const,
} as const;
const MARKER = 24;
const MARKER_OFFSET = -3.5; // centers the marker on the 17px heading
const COLUMN_GAP = 32; // marker to text
const SECTION_GAP = 16; // above and below each divider
const BAR_BOTTOM_GAP = 7; // above the home indicator
const BAR_HEIGHT = 67;
const FADE_HEIGHT = 255;

// SummaryReveal timeline, in ms. First the skeleton (SummarySkeleton) for SKELETON_MS, then each
// section: spinner, then the dot fills, then heading, then body. As a section starts, its skeleton
// block fades out and its slot grows to the real height, so nothing above it moves.
const SKELETON_MS = 2000;
const SKELETON_FADE_MS = 250;
const GROW_MS = 300;
const STATUS_ROOM = 28; // "Ella is writing your note..." and the space under it
const SPIN_MS = 600;
const DOT_MS = 150;
const HEADING_AT = 700;
const HEADING_MS = 200;
const BODY_AT = 800;
const BODY_MS = 250;
const SECTION_MS = BODY_AT + BODY_MS; // the next section starts once this one is done
const BODY_RISE = 8;
const HEADING_ROOM = 48; // marker, heading and the first line of the body
const NOTE_MS = 300;
const BAR_MS = 400;

// Skeleton shapes per section: heading bar width and 2–4 body lines, the last one shorter.
const SKELETONS: { heading: DimensionValue; lines: DimensionValue[] }[] = [
  { heading: '42%', lines: ['100%', '94%', '58%'] },
  { heading: '56%', lines: ['100%', '96%', '90%', '64%'] },
  { heading: '34%', lines: ['100%', '88%', '52%'] },
  { heading: '38%', lines: ['100%', '70%'] },
  { heading: '30%', lines: ['100%', '92%', '60%'] },
];
const SCROLL_LEFT = 19; // content padding, from the Figma frame
const TEXT_X = SCROLL_LEFT + MARKER + COLUMN_GAP;

const easeOut = Easing.out(Easing.cubic);

/** 0 → 1 between `from` and `to` on the reveal clock, eased. */
function ramp(t: number, from: number, to: number) {
  'worklet';
  return easeOut(Math.min(Math.max((t - from) / (to - from), 0), 1));
}

type SummaryRevealProps = {
  sections: SummarySection[];
  /** Play the skeleton and reveal (first showing only). Otherwise everything shows at once. */
  animate: boolean;
  /** Device preview: stay on the skeleton instead of handing off to the reveal. */
  holdSkeleton?: boolean;
  /** The whole summary is visible: at the end of the reveal, on skip, or straight away. */
  onShown: () => void;
  onEdit: () => void;
  onImport: () => void;
};

/**
 * The visit summary, written in one section at a time like the AI Assess animation on the Ella web
 * app, after a short skeleton while Ella "writes". Tapping anywhere before the end skips to it.
 */
export function SummaryReveal({ sections, animate, holdSkeleton = false, onShown, onEdit, onImport }: SummaryRevealProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  // Captured once: the parent marks the summary shown at the end, which must not restart anything.
  const [play] = useState(animate && !reduceMotion);
  const [done, setDone] = useState(!play);

  const shimmer = useShimmer(play);
  const startOf = (i: number) => SKELETON_MS + i * SECTION_MS;
  const noteAt = startOf(sections.length);
  const barAt = noteAt + NOTE_MS;
  const total = barAt + BAR_MS;
  const clock = useSharedValue(play ? 0 : total);

  const scroll = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const viewport = useRef(0);
  const layouts = useRef<LayoutRectangle[]>([]);
  const heights = useRef<number[]>([]); // real section heights (slots grow into them)
  const sectionsY = useRef(0); // sections are measured inside their container
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const shown = useRef(false);
  const callbacks = useRef({ onShown });
  useEffect(() => {
    callbacks.current = { onShown };
  });

  function finish() {
    if (shown.current) return;
    shown.current = true;
    setDone(true);
    callbacks.current.onShown();
  }

  function skip() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    cancelAnimation(clock);
    clock.value = total;
    finish();
  }

  // Keeps the section being written on screen, above the bottom bar, in two gentle steps: just
  // enough for its marker and heading when it starts, then enough for its body as that appears.
  // A section taller than the space left stops at its heading, so the heading is never lost.
  function follow(index: number, part: 'heading' | 'body') {
    const section = layouts.current[index];
    if (!section) return;
    const visible = viewport.current - (BAR_HEIGHT + Math.max(insets.bottom, HOME_INDICATOR_HEIGHT) + EllaSpacing.xl);
    const top = sectionsY.current + section.y;
    const bottom = part === 'heading' ? top + HEADING_ROOM : top + (heights.current[index] ?? section.height);
    const target = Math.min(bottom - visible, top - EllaSpacing.md);
    if (target > scrollY.current) scroll.current?.scrollTo({ y: target, animated: true });
  }

  useEffect(() => {
    if (!play) {
      finish();
      return;
    }
    AccessibilityInfo.announceForAccessibility('Ella is writing your note');
    if (holdSkeleton) return;
    clock.value = withTiming(total, { duration: total, easing: Easing.linear });
    sections.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => follow(i, 'heading'), startOf(i)),
        setTimeout(() => follow(i, 'body'), startOf(i) + BODY_AT),
      );
    });
    timers.current.push(
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), noteAt),
      setTimeout(() => {
        AccessibilityInfo.announceForAccessibility('Summary ready');
        finish();
      }, total),
    );

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      // Left mid-reveal: it still counts as shown, so it won't replay next time.
      finish();
    };
    // Runs once: the reveal plays from mount to the end or a skip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The status line fades as the reveal starts and folds its space away over the first spinner.
  const statusStyle = useAnimatedStyle(() => ({
    opacity: 1 - ramp(clock.value, SKELETON_MS - 200, SKELETON_MS + 100),
    height: STATUS_ROOM * (1 - ramp(clock.value, SKELETON_MS, SKELETON_MS + GROW_MS)),
  }));
  const noteStyle = useAnimatedStyle(() => ({ opacity: ramp(clock.value, noteAt, noteAt + NOTE_MS) }));
  const barStyle = useAnimatedStyle(() => {
    const p = ramp(clock.value, barAt, barAt + BAR_MS);
    return { opacity: p, transform: [{ translateY: (1 - p) * (BAR_HEIGHT + 48) }] };
  });

  const bottomInset = Math.max(insets.bottom, HOME_INDICATOR_HEIGHT);

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scroll}
        onLayout={(e) => (viewport.current = e.nativeEvent.layout.height)}
        onScroll={(e) => (scrollY.current = e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + BAR_BOTTOM_GAP + BAR_HEIGHT + EllaSpacing.section }]}>
        {play && (
          <Animated.View style={[styles.statusRow, statusStyle]}>
            <SummarySkeletonStatus />
          </Animated.View>
        )}

        <View onLayout={(e) => (sectionsY.current = e.nativeEvent.layout.y)}>
          {sections.map((section, i) => (
            <Section
              key={section.title}
              section={section}
              index={i}
              start={startOf(i)}
              last={i === sections.length - 1}
              clock={clock}
              shimmer={play ? shimmer : undefined}
              onLayout={(layout) => (layouts.current[i] = layout)}
              onHeight={(height) => (heights.current[i] = height)}
            />
          ))}
        </View>

        <Animated.View style={[styles.note, noteStyle]}>
          <Image source={require('@/assets/images/summary/sparkle.svg')} style={styles.sparkle} />
          <Text style={styles.noteText}>Written by Ella from your recording. Review before signing.</Text>
        </Animated.View>
      </ScrollView>

      <LinearGradient colors={Frame.fade} style={styles.fade} pointerEvents="none" />

      <Animated.View
        style={[styles.bar, { bottom: bottomInset + BAR_BOTTOM_GAP }, barStyle]}
        pointerEvents={done ? 'box-none' : 'none'}>
        <Pressable
          onPress={onEdit}
          disabled={!done}
          accessibilityRole="button"
          accessibilityLabel="Edit summary"
          accessibilityState={{ disabled: !done }}
          style={({ pressed }) => [styles.edit, pressed && styles.pressed]}>
          <Image source={require('@/assets/images/summary/edit.svg')} style={styles.editIcon} />
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
        <SwipeToConfirm label="Swipe to Import" doneLabel="Imported" disabled={!done} onConfirm={onImport} />
      </Animated.View>

      {!done && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={skip}
          accessibilityRole="button"
          accessibilityLabel="Show the whole summary now"
        />
      )}
    </View>
  );
}

type SectionProps = {
  section: SummarySection;
  index: number;
  start: number;
  last: boolean;
  clock: SharedValue<number>;
  /** Set while the skeleton plays: the section starts as a skeleton block and grows into place. */
  shimmer?: SharedValue<number>;
  onLayout: (layout: LayoutRectangle) => void;
  onHeight: (height: number) => void;
};

function Section({ section, index, start, last, clock, shimmer, onLayout, onHeight }: SectionProps) {
  const skeletonHeight = useSharedValue(0);
  const realHeight = useSharedValue(0);
  const slotStyle = useAnimatedStyle(() => ({
    height: skeletonHeight.value + (realHeight.value - skeletonHeight.value) * ramp(clock.value, start, start + GROW_MS),
  }));
  const skeletonStyle = useAnimatedStyle(() => ({ opacity: 1 - ramp(clock.value, start, start + SKELETON_FADE_MS) }));

  const markerStyle = useAnimatedStyle(() => ({ opacity: ramp(clock.value, start, start + 150) }));
  const spinnerStyle = useAnimatedStyle(() => ({ opacity: 1 - ramp(clock.value, start + SPIN_MS, start + SPIN_MS + DOT_MS) }));
  const dotStyle = useAnimatedStyle(() => {
    const p = ramp(clock.value, start + SPIN_MS, start + SPIN_MS + DOT_MS);
    return { opacity: p, transform: [{ scale: 0.6 + 0.4 * p }] };
  });
  const headingStyle = useAnimatedStyle(() => ({ opacity: ramp(clock.value, start + HEADING_AT, start + HEADING_AT + HEADING_MS) }));
  const bodyStyle = useAnimatedStyle(() => {
    const p = ramp(clock.value, start + BODY_AT, start + BODY_AT + BODY_MS);
    return { opacity: p, transform: [{ translateY: (1 - p) * BODY_RISE }] };
  });

  const content = (
    <View style={styles.section}>
      {/* The rail joins this marker to the next one, like the Figma "Line 3". */}
      <Animated.View style={[styles.rail, last && styles.railLast, bodyStyle]} />
      <Animated.View style={[styles.marker, markerStyle]}>
        <Animated.View style={[styles.markerFill, spinnerStyle]}>
          <Spinner />
        </Animated.View>
        <Animated.View style={[styles.markerFill, dotStyle]}>
          <Asterisk />
        </Animated.View>
      </Animated.View>

      <View style={styles.sectionText}>
        <Animated.Text style={[styles.heading, headingStyle]} accessibilityRole="header">
          {section.title}
        </Animated.Text>
        <Animated.View style={[styles.body, bodyStyle]}>
          {section.text && <Text style={styles.bodyText}>{section.text}</Text>}
          {section.bullets?.map((bullet) => (
            <View key={bullet} style={styles.bullet}>
              <Text style={styles.bodyText}>{'•'}</Text>
              <Text style={[styles.bodyText, styles.bulletText]}>{bullet}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
  const skeleton = SKELETONS[index % SKELETONS.length];

  return (
    <View onLayout={(e) => onLayout(e.nativeEvent.layout)}>
      {shimmer ? (
        // Skeleton and section share one slot; the slot grows from one height to the other.
        <Animated.View style={slotStyle}>
          <Animated.View
            style={[styles.layer, skeletonStyle]}
            onLayout={(e) => skeletonHeight.set(e.nativeEvent.layout.height)}
            pointerEvents="none">
            <SummarySkeleton
              lines={skeleton.lines}
              headingWidth={skeleton.heading}
              shimmer={shimmer}
              markerX={SCROLL_LEFT}
              textX={TEXT_X}
              gap={COLUMN_GAP}
            />
          </Animated.View>
          <View
            style={styles.layer}
            onLayout={(e) => {
              realHeight.set(e.nativeEvent.layout.height);
              onHeight(e.nativeEvent.layout.height);
            }}>
            {content}
          </View>
        </Animated.View>
      ) : (
        content
      )}
      {!last && <Animated.View style={[styles.divider, bodyStyle]} />}
    </View>
  );
}

function Spinner() {
  const turn = useSharedValue(0);
  useEffect(() => {
    turn.value = withRepeat(withTiming(360, { duration: 800, easing: Easing.linear }), -1);
    return () => cancelAnimation(turn);
  }, [turn]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));
  return <Animated.View style={[styles.spinner, style]} />;
}

// The marker's four strokes, from the Figma "Loading animation" component (164:4634).
const STROKES = [0, 45, 90, 135];

function Asterisk() {
  return (
    <View style={styles.asterisk}>
      {STROKES.map((angle) => (
        <View key={angle} style={[styles.stroke, { transform: [{ rotate: `${angle}deg` }] }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  content: {
    paddingTop: EllaSpacing.xxl,
    paddingLeft: SCROLL_LEFT,
    paddingRight: EllaSpacing.md,
  },
  statusRow: {
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  section: {
    flexDirection: 'row',
    gap: COLUMN_GAP,
  },
  rail: {
    position: 'absolute',
    left: MARKER / 2 - 0.5,
    top: MARKER_OFFSET + MARKER,
    // Down to the next marker: divider gaps and the next marker's offset.
    bottom: -(SECTION_GAP * 2 + 1 + MARKER_OFFSET),
    width: 1,
    backgroundColor: Frame.rail,
  },
  railLast: {
    bottom: 0,
  },
  marker: {
    width: MARKER,
    height: MARKER,
    marginTop: MARKER_OFFSET,
    borderRadius: MARKER / 2,
    borderWidth: 2,
    borderColor: Frame.markerBorder,
    backgroundColor: EllaColors.canvas,
  },
  markerFill: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Frame.markerBorder,
    borderTopColor: EllaColors.ellaBlue,
  },
  asterisk: {
    width: 16.5,
    height: 16.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stroke: {
    position: 'absolute',
    width: 1.786,
    height: 16.5,
    backgroundColor: EllaColors.ellaBlue,
  },
  sectionText: {
    flex: 1,
    gap: 7,
  },
  // Neue Haas Grotesk Display Pro 75 Bold in Figma; falls back to Inter Bold like the other display styles.
  heading: {
    fontFamily: EllaFonts.interBold,
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: 0.84,
    color: Frame.heading,
  },
  body: {
    gap: EllaSpacing.md,
  },
  bodyText: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.96,
    color: EllaColors.contentBody,
  },
  bullet: {
    flexDirection: 'row',
    paddingLeft: 9,
    gap: 9,
  },
  bulletText: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: SECTION_GAP,
    marginLeft: MARKER + COLUMN_GAP,
    marginRight: -EllaSpacing.md,
    backgroundColor: Frame.divider,
  },
  note: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 38,
    padding: EllaSpacing.xs,
    borderRadius: 6,
    backgroundColor: Frame.noteFill,
  },
  sparkle: {
    width: 15.29,
    height: 15.29,
    margin: 1.355, // inside its 18px box
  },
  noteText: {
    width: 246,
    fontFamily: EllaFonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.72,
    color: Frame.noteText,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: FADE_HEIGHT,
  },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  edit: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: EllaSpacing.xs,
    paddingHorizontal: EllaSpacing.xl,
    borderRadius: 40,
    backgroundColor: Frame.editFill,
  },
  pressed: {
    opacity: 0.7,
  },
  editIcon: {
    width: 18,
    height: 18,
  },
  editText: {
    fontFamily: EllaFonts.interBold,
    fontSize: 14,
    letterSpacing: 0.84,
    color: Frame.editText,
  },
});
