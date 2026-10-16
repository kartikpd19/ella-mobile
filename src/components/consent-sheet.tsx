import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HOME_INDICATOR_HEIGHT, PrimaryButton } from '@/components/auth-screen';
import { SoundWave } from '@/components/sound-wave';
import { EllaColors, EllaFonts, EllaRadius, EllaSpacing } from '@/constants/ella-tokens';
import { classifyConsent } from '@/lib/consent-intent';
import { createConsentListener, IS_SIMULATED_LISTENER } from '@/lib/consent-listener';
import type { ConsentMethod } from '@/lib/consent-log';

/** Read aloud to the patient. Copied exactly from Figma frame 164:4784. */
export const CONSENT_SCRIPT =
  "\"I'd like to use Ella to help take notes during our visit today. It records our conversation to create your medical note. Your care won't change if you say no. Is that okay with you?\"";

const NO_ANSWER_HINT_SECONDS = 20;
const RECEIVED_PAUSE_MS = 900; // how long "Consent received" shows before recording starts

// Measured from the Figma frame "consent" (164:4784); no design.md token for these.
const Frame = {
  scrim: 'rgba(15,5,5,0.6)',
  handle: '#E7EAF6',
  scriptFill: 'rgba(150,175,255,0.28)',
  scriptText: '#232A30',
  secondaryText: '#606D75',
  cardBorder: 'rgba(151,143,237,0.34)',
  link: 'rgba(0,0,0,0.61)',
  success: 'rgba(5,177,105,0.12)', // semantic-success at 12%
} as const;
const SHEET_RADIUS = 33;
const CONTENT_WIDTH = 362;

type Phase = 'listening' | 'received' | 'declined' | 'confirming';
type ListenerStatus = 'starting' | 'listening' | 'unavailable' | 'denied';

type ConsentSheetProps = {
  patientName: string;
  /** Called once consent is given; only then may recording start. */
  onConsent: (method: ConsentMethod) => void;
  /** Closed without consent: recording must not start. */
  onClose: () => void;
};

/**
 * Asks the patient for consent before any recording. Listens for a spoken yes/no
 * (nothing heard is saved) or lets the doctor confirm a verbal yes manually.
 * Render it only while it should be open; each opening starts fresh.
 */
export function ConsentSheet({ patientName, onConsent, onClose }: ConsentSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const [phase, setPhase] = useState<Phase>('listening');
  const [status, setStatus] = useState<ListenerStatus>('starting');
  const [seconds, setSeconds] = useState(0);
  const [lastHeardAt, setLastHeardAt] = useState(0);

  const phaseRef = useRef<Phase>('listening');
  const listener = useRef<ReturnType<typeof createConsentListener> | null>(null);
  const receivedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function changePhase(next: Phase) {
    phaseRef.current = next;
    setPhase(next);
  }

  function handleTranscript(text: string) {
    if (phaseRef.current !== 'listening') return; // ignore answers while confirming manually or done
    setLastHeardAt(seconds);
    const answer = classifyConsent(text);
    if (answer === 'yes') {
      listener.current?.stop();
      changePhase('received');
      receivedTimer.current = setTimeout(() => onConsent('spoken'), RECEIVED_PAUSE_MS);
    } else if (answer === 'no') {
      listener.current?.stop();
      changePhase('declined');
    }
  }

  // Keep the latest callback for the listener without restarting it.
  const handleRef = useRef(handleTranscript);
  useEffect(() => {
    handleRef.current = handleTranscript;
  });

  // Start listening when the sheet opens; stop when it closes.
  useEffect(() => {
    const instance = createConsentListener({
      onTranscript: (text) => handleRef.current(text),
      // Recognition can stop after a silence; keep listening while waiting for an answer.
      onEnd: () => {
        if (phaseRef.current === 'listening' || phaseRef.current === 'confirming') instance.start();
      },
    });
    listener.current = instance;
    instance.start().then((result) => setStatus(result === 'started' ? 'listening' : result));

    return () => {
      instance.stop();
      listener.current = null;
      clearTimeout(receivedTimer.current);
    };
  }, []);

  // Listening timer, which also drives the "read it again" hint.
  useEffect(() => {
    if (phase !== 'listening') return;
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, [phase]);

  function close() {
    listener.current?.stop();
    onClose();
  }

  function confirmManually() {
    listener.current?.stop();
    onConsent('manual');
  }

  const listening = status === 'listening' && phase === 'listening';
  const showHint = listening && seconds - lastHeardAt >= NO_ANSWER_HINT_SECONDS;
  const timer = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close without recording" />
      </Animated.View>

      <Animated.View
        entering={SlideInDown.springify().damping(18)}
        exiting={SlideOutDown}
        style={[styles.sheet, { maxHeight: screenHeight - insets.top - EllaSpacing.lg }]}
        accessibilityViewIsModal>
        <View style={styles.handle} />

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, HOME_INDICATOR_HEIGHT) }]}
          showsVerticalScrollIndicator={false}>
          {/* Not "Recording": nothing is recorded until the patient consents. */}
          <View style={styles.statusRow} accessibilityLiveRegion="polite">
            <SoundWave color={EllaColors.ellaBlue} size={17} barWidth={1.417} active={listening} />
            <Text style={styles.statusText}>
              {phase === 'received'
                ? 'Consent received'
                : phase === 'declined'
                  ? 'Consent not given'
                  : status === 'listening'
                    ? `${timer} Listening for consent…`
                    : 'Consent needed before recording'}
            </Text>
          </View>

          <View style={styles.script}>
            <Text style={styles.scriptLabel}>Ask for consent</Text>
            <Text style={styles.scriptInstruction}>Read this aloud to {patientName}.</Text>
            <Text style={styles.scriptText}>{CONSENT_SCRIPT}</Text>
          </View>

          {phase === 'confirming' ? (
            <View style={styles.card} accessibilityRole="alert">
              <Text style={styles.cardTitle}>Did the patient verbally agree to recording?</Text>
              <PrimaryButton label="Yes, they agreed" onPress={confirmManually} style={styles.cardButton} />
              <Pressable
                onPress={() => changePhase('listening')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Text style={styles.secondaryLabel}>Cancel</Text>
              </Pressable>
            </View>
          ) : phase === 'received' ? (
            <View style={[styles.card, styles.cardRow]} accessibilityRole="alert">
              <View style={styles.checkCircle}>
                <Image source={require('@/assets/images/welcome/check.svg')} style={styles.checkIcon} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Consent received</Text>
                <Text style={styles.cardBody}>Starting recording…</Text>
              </View>
            </View>
          ) : phase === 'declined' ? (
            <View style={styles.card} accessibilityRole="alert">
              <Text style={styles.cardTitle}>Consent not given</Text>
              <Text style={[styles.cardBody, styles.center]}>
                Recording won’t start. You can continue the visit without Ella.
              </Text>
              <PrimaryButton label="Close" onPress={close} style={styles.cardButton} />
            </View>
          ) : (
            <View style={[styles.card, styles.cardRow, styles.listeningCard]}>
              <SoundWave color={EllaColors.contentInk} active={listening} />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Listening for the patient&apos;s answer</Text>
                <Text style={styles.cardBody}>
                  {status === 'unavailable'
                    ? 'Listening isn’t available on this device. Confirm consent manually below.'
                    : status === 'denied'
                      ? 'Speech recognition is turned off for Ella. Confirm consent manually below.'
                      : showHint
                        ? 'No answer heard yet. Try reading the script again.'
                        : 'When they say yes, recording starts automatically.'}
                </Text>
              </View>
            </View>
          )}

          {IS_SIMULATED_LISTENER && phase === 'listening' && (
            <View style={styles.simulate}>
              <Text style={styles.simulateTag}>Preview only: simulate the patient</Text>
              <View style={styles.simulateRow}>
                <Pressable
                  onPress={() => handleTranscript("Yes, that's fine")}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.simulateButton, pressed && styles.pressed]}>
                  <Text style={styles.simulateLabel}>Patient said yes</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleTranscript("No, I'd rather not")}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.simulateButton, pressed && styles.pressed]}>
                  <Text style={styles.simulateLabel}>Patient said no</Text>
                </Pressable>
              </View>
            </View>
          )}

          {phase === 'listening' && (
            <View style={styles.linkWrap}>
              <Text style={styles.link} onPress={() => changePhase('confirming')} accessibilityRole="link">
                Didn&apos;t catch it? Confirm yes manually
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Frame.scrim,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingTop: EllaSpacing.md,
    gap: EllaSpacing.xs,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    backgroundColor: EllaColors.canvas,
  },
  handle: {
    width: 39,
    height: 4,
    borderRadius: 19,
    backgroundColor: Frame.handle,
  },
  content: {
    alignItems: 'center',
    gap: EllaSpacing.md,
    paddingHorizontal: EllaSpacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: EllaSpacing.xs,
  },
  statusText: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 14,
    letterSpacing: 0.84,
    color: EllaColors.ellaBlue,
  },
  script: {
    width: CONTENT_WIDTH,
    maxWidth: '100%',
    gap: 7.4,
    paddingHorizontal: 12.7,
    paddingVertical: 16.9,
    borderRadius: EllaRadius.md,
    backgroundColor: Frame.scriptFill,
  },
  scriptLabel: {
    fontFamily: EllaFonts.interSemiBold,
    fontSize: 14.8,
    lineHeight: 18,
    color: EllaColors.ellaBlue,
  },
  scriptInstruction: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 16,
    lineHeight: 22.9,
    color: Frame.secondaryText,
  },
  scriptText: {
    fontFamily: EllaFonts.interSemiBold,
    fontSize: 26.3,
    lineHeight: 38.9,
    color: Frame.scriptText,
  },
  card: {
    width: CONTENT_WIDTH,
    maxWidth: '100%',
    alignItems: 'center',
    gap: EllaSpacing.sm,
    paddingHorizontal: EllaSpacing.md,
    paddingVertical: EllaSpacing.md,
    borderWidth: 1,
    borderColor: Frame.cardBorder,
    borderRadius: 17,
    backgroundColor: EllaColors.canvas,
    shadowColor: EllaColors.contentInk,
    shadowOpacity: 0.08,
    shadowRadius: 27,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardRow: {
    flexDirection: 'row',
    gap: EllaSpacing.xs,
  },
  listeningCard: {
    borderStyle: 'dashed',
    paddingVertical: EllaSpacing.xs,
  },
  cardText: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontFamily: EllaFonts.interBold,
    fontSize: 14,
    letterSpacing: 0.84,
    color: EllaColors.contentInk,
  },
  cardBody: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 14,
    letterSpacing: 0.84,
    color: Frame.secondaryText,
  },
  center: {
    textAlign: 'center',
  },
  cardButton: {
    alignSelf: 'stretch',
  },
  secondaryButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: EllaSpacing.sm,
    borderWidth: 1,
    borderColor: EllaColors.surfaceStrong,
    borderRadius: 41,
  },
  secondaryLabel: {
    fontFamily: EllaFonts.apercuBold,
    fontSize: 16.933,
    color: EllaColors.button,
  },
  pressed: {
    opacity: 0.7,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Frame.success,
  },
  checkIcon: {
    width: 20,
    height: 20,
  },
  simulate: {
    width: CONTENT_WIDTH,
    maxWidth: '100%',
    gap: EllaSpacing.xs,
    padding: EllaSpacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: EllaColors.contentSoft,
    borderRadius: EllaRadius.md,
  },
  simulateTag: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 11,
    letterSpacing: 0.5,
    color: EllaColors.contentMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  simulateRow: {
    flexDirection: 'row',
    gap: EllaSpacing.xs,
  },
  simulateButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: EllaSpacing.xs,
    borderRadius: EllaRadius.sm,
    backgroundColor: EllaColors.surfaceSoft,
  },
  simulateLabel: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 14,
    color: EllaColors.contentBody,
  },
  linkWrap: {
    paddingHorizontal: EllaSpacing.xl,
    paddingVertical: EllaSpacing.md,
  },
  link: {
    fontFamily: EllaFonts.displayRoman,
    fontSize: 14,
    lineHeight: 20,
    color: Frame.link,
    textAlign: 'center',
  },
});
