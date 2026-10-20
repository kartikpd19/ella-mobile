import { Image } from 'expo-image';
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AudioLevelVisual } from '@/components/audio-level-visual';
import { HOME_INDICATOR_HEIGHT, PrimaryButton, STATUS_BAR_HEIGHT } from '@/components/auth-screen';
import { AddNoteSheet, EndRecordingDialog } from '@/components/recording-sheets';
import { EllaColors, EllaFonts, EllaSpacing } from '@/constants/ella-tokens';
import { useConsent } from '@/lib/consent-log';
import { addNote, finishRecording, formatElapsed } from '@/lib/recording-log';
import { IS_SIMULATED_MIC, useRecordingSession } from '@/lib/recording-session';
import { getVisit } from '@/lib/sample-visits';

// Measured from the Figma frames "iPhone 16 - 51" (104:4501) and "iPhone 16 - 38" (104:4459);
// no design.md token for these.
const Frame = {
  idText: 'rgba(0,0,0,0.66)',
  timerText: 'rgba(43,43,43,0.55)', // Content-body at 55%
  controlLabel: '#141414',
  noteFill: '#E7EBEE', // fills the cut-outs of the Add Note circle
  fade: ['rgba(255,255,255,0)', '#FFFFFF'] as const, // white fade behind the controls
} as const;
const TOP_BAR_OFFSET = 31; // below the status bar
const TIMER_GAP = 90; // patient ID to timer
const VISUAL_OFFSET = -7; // the visual sits 7px above the frame's vertical center
const CONTROLS_BOTTOM_GAP = 11; // above the home indicator
const FADE_HEIGHT = 255;
const NOTE_SAVED_MS = 3000;

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/home');
  }
}

/** Live visit recording, opened after consent and the countdown. `?sim=` previews it in the browser. */
export default function RecordingScreen() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const { id, sim } = useLocalSearchParams<{ id?: string; sim?: string }>();
  const visit = getVisit(id);
  const consent = useConsent(id);

  // Recording never starts without logged consent. The browser preview captures nothing, so
  // its `?sim=` variants may open without it.
  const allowed = Boolean(visit && (consent || (IS_SIMULATED_MIC && sim)));
  const session = useRecordingSession({ enabled: allowed, sim });

  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const [noteAt, setNoteAt] = useState<number | null>(null);
  const [savedNoteAt, setSavedNoteAt] = useState<number | null>(null);

  // Android back asks first, like the back arrow. (iOS swipe-back is off for this screen in _layout.)
  useEffect(() => {
    if (!allowed) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      setConfirmEnd(true);
      return true;
    });
    return () => back.remove();
  }, [allowed]);

  useEffect(() => {
    if (savedNoteAt === null) return;
    const timer = setTimeout(() => setSavedNoteAt(null), NOTE_SAVED_MS);
    return () => clearTimeout(timer);
  }, [savedNoteAt]);

  async function endAndSave() {
    if (!visit) return;
    setEnding(true);
    const durationMs = session.elapsedMs;
    const uri = await session.stop();
    finishRecording(visit.id, uri, durationMs);
    router.replace({ pathname: '/processing', params: { id: visit.id } });
  }

  function saveNote(text: string) {
    if (!visit || noteAt === null) return;
    addNote(visit.id, text, noteAt);
    setSavedNoteAt(noteAt);
    setNoteAt(null);
  }

  const topInset = Math.max(insets.top, STATUS_BAR_HEIGHT);
  const bottomInset = Math.max(insets.bottom, HOME_INDICATOR_HEIGHT);
  const elapsed = formatElapsed(session.elapsedMs);

  if (!visit || !allowed) {
    return (
      <View style={[styles.screen, styles.blocked, { paddingTop: topInset + EllaSpacing.section }]}>
        <StatusBar style="dark" />
        <Text style={styles.blockedText}>
          {visit ? 'Recording needs the patient’s consent first.' : 'This visit couldn’t be found.'}
        </Text>
        <PrimaryButton label="Back to visit" onPress={goBack} style={styles.blockedButton} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={[styles.visual, { transform: [{ translateY: VISUAL_OFFSET }] }]} pointerEvents="none">
        <AudioLevelVisual level={session.level} />
      </View>
      <LinearGradient colors={Frame.fade} style={styles.fade} pointerEvents="none" />

      <View style={[styles.topBar, { marginTop: topInset + TOP_BAR_OFFSET }]}>
        <Pressable
          onPress={() => setConfirmEnd(true)}
          accessibilityRole="button"
          accessibilityLabel="End recording and go back"
          hitSlop={10}>
          <Image source={require('@/assets/images/recording/back.svg')} style={styles.icon} />
        </Pressable>
        {/* Placeholder: the menu has no actions yet. */}
        <Pressable accessibilityRole="button" accessibilityLabel="More options" hitSlop={10}>
          <Image source={require('@/assets/images/recording/menu-dots.svg')} style={styles.icon} />
        </Pressable>
      </View>

      <Text style={styles.name} numberOfLines={1} accessibilityRole="header">
        {visit.patient}
      </Text>
      <Text style={styles.patientId} accessibilityLabel={`Patient ID ${visit.patientId}`}>
        {visit.patientId}
      </Text>
      <Text style={styles.timer} accessibilityLabel={`Recording time ${elapsed}`}>
        {elapsed}
      </Text>

      <View style={[styles.bottom, { bottom: bottomInset + CONTROLS_BOTTOM_GAP }]}>
        {savedNoteAt !== null && (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.noteSaved} accessibilityLiveRegion="polite">
            Note saved at {formatElapsed(savedNoteAt)}
          </Animated.Text>
        )}
        {session.error ? (
          <Text style={[styles.status, styles.recording, styles.error]} accessibilityRole="alert">
            {session.error}
          </Text>
        ) : (
          <View style={styles.statusRow} accessibilityLiveRegion="polite">
            <MicGlyph color={session.paused ? EllaColors.contentMuted : EllaColors.semanticError} />
            <Text style={[styles.status, session.paused ? styles.paused : styles.recording]}>
              {session.paused ? 'Paused' : 'Recording...'}
            </Text>
          </View>
        )}

        <View style={styles.controls}>
          <Pressable
            onPress={() => setNoteAt(session.elapsedMs)}
            accessibilityRole="button"
            accessibilityLabel="Add note"
            style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
            <View style={styles.circleIcon}>
              <View style={styles.noteFill} />
              <Image source={require('@/assets/images/recording/add-note-circle.svg')} style={styles.noteCircle} />
              <Image source={require('@/assets/images/recording/add-note-pen.svg')} style={styles.notePen} />
            </View>
            <Text style={styles.controlLabel}>Add Note</Text>
          </Pressable>

          <Pressable
            onPress={() => setConfirmEnd(true)}
            accessibilityRole="button"
            accessibilityLabel="End recording"
            style={({ pressed }) => [styles.control, styles.endControl, pressed && styles.pressed]}>
            <Image source={require('@/assets/images/recording/end.svg')} style={styles.endIcon} />
            <Text style={styles.controlLabel}>End</Text>
          </Pressable>

          <Pressable
            onPress={session.paused ? session.resume : session.pause}
            accessibilityRole="button"
            accessibilityLabel={session.paused ? 'Resume recording' : 'Pause recording'}
            style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
            <Image
              source={
                session.paused
                  ? require('@/assets/images/recording/resume.svg')
                  : require('@/assets/images/recording/pause.svg')
              }
              style={styles.circleIcon}
            />
            <Text style={styles.controlLabel}>{session.paused ? 'Resume' : 'Pause'}</Text>
          </Pressable>
        </View>
      </View>

      {noteAt !== null && (
        <AddNoteSheet timestamp={formatElapsed(noteAt)} onSave={saveNote} onClose={() => setNoteAt(null)} />
      )}
      {confirmEnd && (
        <EndRecordingDialog ending={ending} onEnd={endAndSave} onKeep={() => setConfirmEnd(false)} />
      )}
    </View>
  );
}

// The mic glyph beside "Recording...": five bars, from the Figma frame's "Group 1171279800".
const GLYPH_BARS = [7.083, 11.333, 17, 11.333, 7.083];

function MicGlyph({ color }: { color: string }) {
  return (
    <View style={styles.glyph} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {GLYPH_BARS.map((height, i) => (
        <View key={i} style={[styles.glyphBar, { height, backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: EllaColors.canvas,
  },
  visual: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: FADE_HEIGHT,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 18,
    paddingRight: 18,
  },
  icon: {
    width: 24,
    height: 24,
  },
  name: {
    marginTop: 15,
    paddingHorizontal: EllaSpacing.xl,
    fontFamily: EllaFonts.interSemiBold,
    fontSize: 24,
    lineHeight: 24,
    color: EllaColors.contentInk,
    textAlign: 'center',
  },
  patientId: {
    marginTop: EllaSpacing.xs,
    fontFamily: EllaFonts.monoRegular,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.84,
    color: Frame.idText,
    textAlign: 'center',
  },
  timer: {
    marginTop: TIMER_GAP,
    fontFamily: EllaFonts.monoMedium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.96,
    color: Frame.timerText,
    textAlign: 'center',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 39,
  },
  noteSaved: {
    position: 'absolute',
    top: -EllaSpacing.xl,
    fontFamily: EllaFonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
    color: EllaColors.contentMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: EllaSpacing.xs,
  },
  status: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: 0.84,
    textAlign: 'center',
  },
  recording: {
    color: EllaColors.semanticError,
  },
  paused: {
    color: EllaColors.contentMuted,
  },
  error: {
    paddingHorizontal: EllaSpacing.xl,
  },
  glyph: {
    width: 12.75,
    height: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glyphBar: {
    width: 1.417,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: EllaSpacing.xxl,
  },
  control: {
    width: 64,
    height: 93,
    alignItems: 'center',
    gap: 14,
  },
  endControl: {
    width: 103,
    gap: EllaSpacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  circleIcon: {
    width: 64,
    height: 64,
  },
  // The Add Note icon is three Figma layers: a fill, a ring (inset 4px) and the pen.
  noteFill: {
    position: 'absolute',
    top: '26.09%',
    right: '26.81%',
    bottom: '28.99%',
    left: '32.61%',
    backgroundColor: Frame.noteFill,
  },
  noteCircle: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 56,
    height: 56,
  },
  notePen: {
    position: 'absolute',
    top: 19,
    left: 19,
    width: 26.128,
    height: 26.128,
  },
  endIcon: {
    width: 103,
    height: 70,
  },
  // design.md has no 12px Regular with tracking; from the frame.
  controlLabel: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.72,
    color: Frame.controlLabel,
    textAlign: 'center',
  },
  blocked: {
    alignItems: 'center',
    gap: EllaSpacing.md,
    paddingHorizontal: EllaSpacing.xl,
  },
  blockedText: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 16,
    lineHeight: 24,
    color: EllaColors.contentBody,
    textAlign: 'center',
  },
  blockedButton: {
    alignSelf: 'stretch',
  },
});
