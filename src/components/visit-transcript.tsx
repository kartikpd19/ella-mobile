import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AudioWaveform } from '@/components/audio-waveform';
import { HOME_INDICATOR_HEIGHT } from '@/components/auth-screen';
import { EllaColors, EllaFonts, EllaSpacing } from '@/constants/ella-tokens';
import { useSimulatedPlayback } from '@/lib/playback';
import {
  clockTime,
  keyPointRanges,
  offsetMs,
  SAMPLE_DURATION_MS,
  SAMPLE_TRANSCRIPT,
  type TranscriptLine,
  type TranscriptSpeaker,
} from '@/lib/sample-transcript';

// Measured from the Figma transcript frames (295:6306, 296:8075, 295:6734, 296:8166);
// no design.md token for these.
const Frame = {
  segmentTrack: '#EEEFF5',
  segmentOn: '#515151',
  segmentOff: 'rgba(0,0,0,0.42)',
  keyLabel: 'rgba(0,0,0,0.48)',
  toggleOn: '#144AEE',
  toggleOff: 'rgba(120,120,128,0.16)',
  time: '#706666',
  highlight: '#F2DBF8',
  controlFill: '#E7EBEE',
  controlLabel: '#141414',
  fade: ['rgba(255,255,255,0)', '#FFFFFF'] as const,
} as const;
const SIDE = 29; // left and right edge of the transcript column
const TOGGLE_WIDTH = 41;
const TOGGLE_HEIGHT = 25;
const KNOB = 21.8;
const KNOB_INSET = 1.6;
const CONTROLS_BOTTOM_GAP = 11; // above the home indicator, as on the recording screen
const SKIP_MS = 10000;

export type TranscriptView = 'text' | 'audio';

type VisitTranscriptProps = {
  doctorName: string;
  patientName: string;
  initialView?: TranscriptView;
  initialKeyPoints?: boolean;
};

/** The Transcript tab of a recorded visit: the conversation as text or audio, with Key Points. */
export function VisitTranscript({ doctorName, patientName, initialView = 'text', initialKeyPoints = false }: VisitTranscriptProps) {
  const [view, setView] = useState<TranscriptView>(initialView);
  const [keyPoints, setKeyPoints] = useState(initialKeyPoints);
  // Lives here, not in the audio view, so switching views keeps the position.
  const playback = useSimulatedPlayback(SAMPLE_DURATION_MS);

  const firstName = patientName.split(' ')[0];
  const names: Record<TranscriptSpeaker, string> = { doctor: doctorName, patient: patientName };

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <View style={styles.segments} accessibilityRole="tablist">
          {(['text', 'audio'] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setView(option)}
              accessibilityRole="tab"
              accessibilityState={{ selected: view === option }}
              style={[styles.segment, view === option && styles.segmentSelected]}>
              <Text style={[styles.segmentText, view === option && styles.segmentTextSelected]}>
                {option === 'text' ? 'Transcript' : 'Audio'}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.keyPoints}>
          <Text style={styles.keyLabel}>Key Points</Text>
          <Toggle value={keyPoints} onChange={setKeyPoints} label="Key Points" />
        </View>
      </View>

      {view === 'text' ? (
        <ScrollView contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
          {groupBySpeaker(SAMPLE_TRANSCRIPT).map((group) => (
            <View key={group[0].at} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.speaker}>{names[group[0].speaker]}</Text>
                <View style={styles.dot} />
                <Text style={styles.time}>{clockTime(offsetMs(group[0].at))}</Text>
              </View>
              {group.map((line) => (
                <Text key={line.at} style={styles.line}>
                  {highlight(line.text.replace('{patient}', firstName), keyPoints ? line.keyPoints : undefined)}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <AudioView keyPoints={keyPoints} playback={playback} />
      )}
    </View>
  );
}

type AudioViewProps = {
  keyPoints: boolean;
  playback: ReturnType<typeof useSimulatedPlayback>;
};

function AudioView({ keyPoints, playback }: AudioViewProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, HOME_INDICATOR_HEIGHT) + CONTROLS_BOTTOM_GAP;

  return (
    <View style={styles.audio}>
      <View style={styles.waveWrap}>
        <AudioWaveform
          durationMs={SAMPLE_DURATION_MS}
          positionMs={playback.positionMs}
          keyRanges={keyPoints ? keyPointRanges() : undefined}
          onSeek={playback.seek}
        />
        <View style={styles.times}>
          <Text style={styles.clock}>{clockTime(0)}</Text>
          <Text style={styles.clock}>{clockTime(SAMPLE_DURATION_MS)}</Text>
        </View>
      </View>

      <LinearGradient colors={Frame.fade} locations={[0.06, 0.35]} style={styles.fade} pointerEvents="none" />
      <View style={[styles.controls, { bottom }]}>
        <Pressable
          onPress={() => playback.skip(-SKIP_MS)}
          accessibilityRole="button"
          accessibilityLabel="Back 10 seconds"
          style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
          <View style={styles.circle}>
            <Image source={require('@/assets/images/transcript/back-10.svg')} style={styles.backIcon} />
          </View>
          <Text style={styles.controlLabel}>Back</Text>
        </Pressable>
        <Pressable
          onPress={playback.toggle}
          accessibilityRole="button"
          accessibilityLabel={playback.playing ? 'Pause' : 'Play'}
          style={({ pressed }) => [styles.control, styles.playControl, pressed && styles.pressed]}>
          <View style={styles.play}>
            <Image
              source={
                playback.playing
                  ? require('@/assets/images/transcript/pause.svg')
                  : require('@/assets/images/transcript/play.svg')
              }
              style={styles.playIcon}
            />
          </View>
          <Text style={styles.controlLabel}>{playback.playing ? 'Pause' : 'Play'}</Text>
        </Pressable>
        <Pressable
          onPress={() => playback.skip(SKIP_MS)}
          accessibilityRole="button"
          accessibilityLabel="Forward 10 seconds"
          style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
          <View style={styles.circle}>
            <Image source={require('@/assets/images/transcript/forward-10.svg')} style={styles.forwardIcon} />
          </View>
          <Text style={styles.controlLabel}>Forward</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** iOS-style switch from the Figma "Toggle" component (37:5675). */
function Toggle({ value, onChange, label }: { value: boolean; onChange: (next: boolean) => void; label: string }) {
  const on = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    on.value = withTiming(value ? 1 : 0, { duration: 180, easing: Easing.out(Easing.cubic) });
  }, [value, on]);
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: on.value * (TOGGLE_WIDTH - KNOB - KNOB_INSET * 2) }],
  }));

  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      style={[styles.toggle, { backgroundColor: value ? Frame.toggleOn : Frame.toggleOff }]}>
      <Animated.View style={[styles.knob, knobStyle]} />
    </Pressable>
  );
}

/** Consecutive lines by the same speaker share one name and time. */
function groupBySpeaker(lines: TranscriptLine[]): TranscriptLine[][] {
  return lines.reduce<TranscriptLine[][]>((groups, line) => {
    const last = groups[groups.length - 1];
    if (last && last[0].speaker === line.speaker) last.push(line);
    else groups.push([line]);
    return groups;
  }, []);
}

/** Wraps each key phrase in the soft purple highlight. */
function highlight(text: string, phrases: string[] | undefined) {
  if (!phrases?.length) return text;
  const parts: (string | { key: string })[] = [text];
  for (const phrase of phrases) {
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (typeof part !== 'string') continue;
      const at = part.indexOf(phrase);
      if (at < 0) continue;
      parts.splice(i, 1, part.slice(0, at), { key: phrase }, part.slice(at + phrase.length));
      break;
    }
  }
  return parts.map((part, i) =>
    typeof part === 'string' ? (
      part
    ) : (
      <Text key={i} style={styles.highlight}>
        {part.key}
      </Text>
    ),
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 34,
    marginTop: 23,
    paddingHorizontal: SIDE,
  },
  segments: {
    flexDirection: 'row',
    padding: EllaSpacing.xxs,
    borderRadius: 8,
    backgroundColor: Frame.segmentTrack,
  },
  segment: {
    paddingHorizontal: EllaSpacing.xs,
    paddingVertical: EllaSpacing.xxs,
    borderRadius: 8,
  },
  segmentSelected: {
    backgroundColor: EllaColors.canvas,
  },
  segmentText: {
    fontFamily: EllaFonts.monoRegular,
    fontSize: 14,
    letterSpacing: 0.84,
    color: Frame.segmentOff,
  },
  segmentTextSelected: {
    color: Frame.segmentOn,
  },
  keyPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  keyLabel: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 14,
    letterSpacing: 0.84,
    color: Frame.keyLabel,
  },
  toggle: {
    width: TOGGLE_WIDTH,
    height: TOGGLE_HEIGHT,
    borderRadius: TOGGLE_HEIGHT / 2,
    justifyContent: 'center',
    paddingHorizontal: KNOB_INSET,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: EllaColors.canvas,
    shadowColor: EllaColors.contentInk,
    shadowOpacity: 0.15,
    shadowRadius: 3.2,
    shadowOffset: { width: 0, height: 2.4 },
    elevation: 2,
  },
  messages: {
    gap: EllaSpacing.md,
    paddingTop: 15,
    paddingHorizontal: SIDE,
    paddingBottom: EllaSpacing.section + HOME_INDICATOR_HEIGHT,
  },
  group: {
    gap: 7,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  speaker: {
    fontFamily: EllaFonts.interBold,
    fontSize: 14,
    letterSpacing: 0.84,
    color: EllaColors.contentInk,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: EllaColors.contentInk,
  },
  time: {
    padding: EllaSpacing.xxs,
    fontFamily: EllaFonts.interRegular,
    fontSize: 14,
    letterSpacing: 0.84,
    color: Frame.time,
  },
  line: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.96,
    color: EllaColors.contentBody,
  },
  highlight: {
    borderRadius: 3,
    backgroundColor: Frame.highlight,
  },
  audio: {
    flex: 1,
  },
  waveWrap: {
    marginTop: 39,
    paddingHorizontal: SIDE,
    gap: 50,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clock: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 12,
    letterSpacing: 0.72,
    color: EllaColors.contentBody,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 143,
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: EllaSpacing.xxl,
  },
  control: {
    width: 64,
    height: 93,
    alignItems: 'center',
    gap: 14,
  },
  playControl: {
    width: 103,
    gap: EllaSpacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Frame.controlFill,
  },
  backIcon: {
    position: 'absolute',
    top: 15,
    left: 18,
    width: 28.138,
    height: 34,
  },
  forwardIcon: {
    position: 'absolute',
    top: 15,
    left: 18,
    width: 28.303,
    height: 34,
  },
  play: {
    width: 103,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EllaColors.button,
  },
  playIcon: {
    width: 16,
    height: 16,
  },
  controlLabel: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.72,
    color: Frame.controlLabel,
    textAlign: 'center',
  },
});
