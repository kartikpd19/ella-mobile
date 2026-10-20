import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { EllaColors } from '@/constants/ella-tokens';

// Measured from the Figma frames "Transcript - Key Points enable/Disable (audio)" (295:6734, 296:8166).
const Frame = {
  unplayed: '#D6D8DA',
  keyPoint: '#DDACEA',
  // Not in Figma (its key moments are all ahead of the playhead): a deeper purple once played,
  // so progress still shows through a key moment.
  keyPointPlayed: '#B77FC9',
} as const;
const BAR_WIDTH = 2;
const BAR_GAP = 1;
const PADDING = 16;
export const WAVEFORM_HEIGHT = 203; // tallest bar
const TAP_SLOP = 6; // a drag shorter than this is a tap

// Bar heights from the Figma frame: an opening run, then a repeating stretch.
const INTRO = [45, 33, 73, 33, 85, 33, 59, 85, 113, 59, 45, 33];
const LOOP = [151, 99, 125, 111, 59, 33, 99, 177, 111, 137, 85, 111, 137, 163, 203];
const barHeight = (i: number) => (i < INTRO.length ? INTRO[i] : LOOP[(i - INTRO.length) % LOOP.length]);

export type TimeRange = { start: number; end: number };

type AudioWaveformProps = {
  durationMs: number;
  positionMs: number;
  /** Key point moments, drawn in purple. Leave out to hide them. */
  keyRanges?: TimeRange[];
  onSeek: (ms: number) => void;
};

/** Full-width waveform: played part dark, the rest light. Tap or drag to scrub; tap a key point to jump to it. */
export function AudioWaveform({ durationMs, positionMs, keyRanges, onSeek }: AudioWaveformProps) {
  const [width, setWidth] = useState(0);
  const inner = Math.max(width - PADDING * 2, 0);
  const count = Math.floor((inner + BAR_GAP) / (BAR_WIDTH + BAR_GAP));
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  const timeAt = (x: number) => Math.min(Math.max((x - PADDING) / Math.max(inner, 1), 0), 1) * durationMs;
  const rangeAt = (ms: number) => keyRanges?.find((range) => ms >= range.start && ms < range.end);

  const scrub = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onUpdate((e) => {
      if (Math.abs(e.translationX) >= TAP_SLOP) onSeek(timeAt(e.x));
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) >= TAP_SLOP) return;
      const ms = timeAt(e.x);
      onSeek(rangeAt(ms)?.start ?? ms);
    });

  return (
    <GestureDetector gesture={scrub}>
      <View
        style={styles.wave}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Recording position"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => onSeek(positionMs + (e.nativeEvent.actionName === 'increment' ? 10000 : -10000))}>
        {Array.from({ length: count }, (_, i) => {
          const at = ((i + 0.5) / count) * durationMs;
          const played = at <= positionMs;
          const key = rangeAt(at);
          const color = key
            ? played
              ? Frame.keyPointPlayed
              : Frame.keyPoint
            : played
              ? EllaColors.button
              : Frame.unplayed;
          return <View key={i} style={[styles.bar, { height: barHeight(i), backgroundColor: color }]} />;
        })}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wave: {
    height: WAVEFORM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: BAR_GAP,
    paddingHorizontal: PADDING,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 15,
  },
});
