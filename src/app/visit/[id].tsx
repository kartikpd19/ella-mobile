import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HOME_INDICATOR_HEIGHT, PrimaryButton, STATUS_BAR_HEIGHT } from '@/components/auth-screen';
import { ConsentSheet } from '@/components/consent-sheet';
import { RecordingCountdown } from '@/components/recording-countdown';
import { useSimulatedPermissionPrompt } from '@/components/simulated-permission-prompt';
import { UnderlineTabs } from '@/components/underline-tabs';
import { StatusBadge } from '@/components/visit-row';
import { EllaColors, EllaFonts, EllaSpacing } from '@/constants/ella-tokens';
import { getPermission, IS_SIMULATED, requestPermission } from '@/lib/permissions';
import { describeConsent, logConsent, useConsent, type ConsentMethod } from '@/lib/consent-log';
import { getVisit, initials } from '@/lib/sample-visits';

const TABS = ['Summary', 'Transcript', 'Notes'] as const;
type Tab = (typeof TABS)[number];

const EMPTY_STATES: Record<Tab, { icon: number; text: string }> = {
  Summary: { icon: require('@/assets/images/visit/summary.svg'), text: 'Summaries will appear after consultations.' },
  Transcript: {
    icon: require('@/assets/images/visit/transcript.svg'),
    text: 'Transcripts will appear after you record a consultation.',
  },
  Notes: { icon: require('@/assets/images/visit/notes.svg'), text: 'Notes for this visit will appear here.' },
};

// Measured from the Figma frame "Vistit deatil/ Default" (104:5304); no design.md token for these.
const Frame = {
  avatarFill: '#E7EBFA',
  avatarText: '#144AEE',
  secondaryText: '#606D75',
  ageText: 'rgba(0,0,0,0.66)',
  tabDivider: 'rgba(227,227,227,0.69)',
  cardBorder: 'rgba(151,143,237,0.34)',
  // The frame's background is two blurred ellipses; approximated with a soft gradient.
  wash: ['rgba(255,255,255,0)', 'rgba(175,177,255,0.12)', 'rgba(87,122,242,0.07)', 'rgba(255,255,255,0)'] as const,
} as const;
const TOP_BAR_OFFSET = 31; // below the status bar
const AVATAR_SIZE = 51;
const CARD_BOTTOM_GAP = 44; // above the home indicator

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/home');
  }
}

export default function VisitDetailScreen() {
  const insets = useSafeAreaInsets();
  // `?countdown=preview` plays the countdown on a loop for the device preview, without recording.
  const { id, countdown } = useLocalSearchParams<{ id: string; countdown?: string }>();
  const previewCountdown = countdown === 'preview';
  const visit = getVisit(id);

  const [tab, setTab] = useState<Tab>('Summary');
  const [micBlocked, setMicBlocked] = useState(false);
  const simulated = useSimulatedPermissionPrompt();
  const [consentOpen, setConsentOpen] = useState(false);
  const consent = useConsent(id);
  const [countdownOpen, setCountdownOpen] = useState(previewCountdown);
  const [countdownRun, setCountdownRun] = useState(0);

  // Only path to recording: consent was spoken or manually confirmed, and is logged on the visit.
  // The countdown plays next; recording starts only once it finishes (`startRecordingNow`).
  function handleConsent(method: ConsentMethod) {
    if (!visit) return;
    logConsent(visit.id, method);
    setConsentOpen(false);
    setCountdownOpen(true);
  }

  function startRecordingNow() {
    if (previewCountdown) {
      setCountdownRun((run) => run + 1);
      return;
    }
    if (!visit || !consent) return;
    router.push({ pathname: '/recording', params: { id: visit.id } });
  }

  // The countdown stays up under the recording screen's fade-in; clear it on the way back.
  useFocusEffect(
    useCallback(() => {
      if (!previewCountdown) setCountdownOpen(false);
    }, [previewCountdown, setCountdownOpen]),
  );

  const topInset = Math.max(insets.top, STATUS_BAR_HEIGHT);
  const bottomInset = Math.max(insets.bottom, HOME_INDICATOR_HEIGHT);

  // Recording needs the microphone. Ask now if it wasn't granted on the Welcome screen.
  async function startRecording() {
    let mic = await getPermission('microphone').catch(() => 'undetermined' as const);
    if (mic !== 'granted') {
      if (IS_SIMULATED) {
        mic = (await simulated.ask('microphone')) ? 'granted' : 'denied';
      } else {
        mic = await requestPermission('microphone').catch(() => 'denied' as const);
      }
    }

    if (mic === 'granted') {
      setMicBlocked(false);
      // Recording never starts here: the patient must consent first.
      setConsentOpen(true);
    } else {
      setMicBlocked(true);
    }
  }

  function openSettings() {
    // The browser can't open OS settings, so the preview asks again instead.
    if (IS_SIMULATED) {
      startRecording();
    } else {
      Linking.openSettings();
    }
  }

  const empty = EMPTY_STATES[tab];

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={[styles.topBar, { marginTop: topInset + TOP_BAR_OFFSET }]}>
        <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back to Home" hitSlop={10}>
          <Image source={require('@/assets/images/visit/back.svg')} style={styles.icon} />
        </Pressable>
        <Text style={styles.topTitle} accessibilityRole="header">
          Visit detail
        </Text>
        {/* Placeholder: the menu has no actions yet. */}
        <Pressable accessibilityRole="button" accessibilityLabel="More options" hitSlop={10}>
          <Image source={require('@/assets/images/visit/menu-dots.svg')} style={styles.icon} />
        </Pressable>
      </View>

      {visit ? (
        <>
          <View style={styles.patient}>
            <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no">
              <Text style={styles.avatarText}>{initials(visit.patient)}</Text>
            </View>
            <View style={styles.patientText}>
              <Text style={styles.patientName} numberOfLines={1}>
                {visit.patient}
              </Text>
              <View style={styles.patientMeta}>
                <Text style={[styles.mono, styles.age]}>Age {visit.age}</Text>
                <Text style={styles.mono} accessibilityLabel={`Patient ID ${visit.patientId}`}>
                  {visit.patientId}
                </Text>
              </View>
            </View>
            <StatusBadge visit={visit} fallbackToAppointment />
          </View>

          <View style={styles.tabsWrap}>
            <View style={styles.tabDivider} />
            <UnderlineTabs tabs={TABS} selected={tab} onSelect={setTab} style={styles.tabs} />
          </View>

          <View style={styles.body}>
            <LinearGradient
              colors={Frame.wash}
              locations={[0, 0.35, 0.65, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.35, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.empty}>
              <Image source={empty.icon} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>{empty.text}</Text>
            </View>
          </View>

          {/* Pinned above the home indicator, over the tab content. */}
          <View style={[styles.card, { bottom: bottomInset + CARD_BOTTOM_GAP }]}>
            <Text style={styles.cardTitle}>Ready to record?</Text>
            <Text style={styles.cardText}>Start recording to capture this consultation.</Text>
            {consent && <Text style={styles.consentNote}>{describeConsent(consent)}</Text>}
            <PrimaryButton label="Start recording" onPress={startRecording} style={styles.recordButton} />
            {micBlocked && (
              <View style={styles.micBlocked}>
                <Text style={styles.micNote} accessibilityRole="alert">
                  Ella needs microphone access to record.
                </Text>
                <Text style={styles.micLink} onPress={openSettings} accessibilityRole="link">
                  {IS_SIMULATED ? 'Try again' : 'Open settings'}
                </Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.missing}>
          <Text style={styles.emptyText}>This visit couldn’t be found.</Text>
          <Text style={styles.micLink} onPress={goBack} accessibilityRole="link">
            Back to Home
          </Text>
        </View>
      )}

      {visit && consentOpen && (
        <ConsentSheet
          patientName={visit.patient}
          onConsent={handleConsent}
          onClose={() => setConsentOpen(false)}
        />
      )}

      {visit && countdownOpen && (
        <RecordingCountdown key={countdownRun} onDone={startRecordingNow} onCancel={() => setCountdownOpen(false)} />
      )}

      {IS_SIMULATED && simulated.prompt}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: EllaColors.canvas,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 18,
    paddingRight: 15,
  },
  icon: {
    width: 24,
    height: 24,
  },
  topTitle: {
    fontFamily: EllaFonts.interBold,
    fontSize: 16,
    letterSpacing: 0.96,
    color: EllaColors.contentInk,
    textAlign: 'center',
  },
  patient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 43,
    paddingLeft: EllaSpacing.xl,
    paddingRight: EllaSpacing.xl,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Frame.avatarFill,
  },
  avatarText: {
    fontFamily: EllaFonts.interSemiBold,
    fontSize: 20,
    lineHeight: 21,
    color: Frame.avatarText,
  },
  patientText: {
    flex: 1,
  },
  patientName: {
    fontFamily: EllaFonts.interSemiBold,
    fontSize: 20,
    lineHeight: 24,
    color: EllaColors.contentInk,
  },
  patientMeta: {
    flexDirection: 'row',
    gap: 26,
  },
  mono: {
    fontFamily: EllaFonts.monoRegular,
    fontSize: 16,
    letterSpacing: 0.96,
    color: EllaColors.contentInk,
  },
  age: {
    color: Frame.ageText,
  },
  tabsWrap: {
    marginTop: 42,
  },
  tabs: {
    paddingHorizontal: 23,
  },
  // Full-width rule the selected tab's underline sits on.
  tabDivider: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -0.5,
    height: 4,
    borderRadius: 2,
    backgroundColor: Frame.tabDivider,
  },
  body: {
    flex: 1,
  },
  empty: {
    alignSelf: 'center',
    width: 260,
    alignItems: 'center',
    gap: 18.7,
    paddingTop: 84,
  },
  emptyIcon: {
    width: 51.2,
    height: 51.2,
  },
  emptyText: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 17.5,
    letterSpacing: 1.05,
    color: Frame.secondaryText,
    textAlign: 'center',
  },
  card: {
    position: 'absolute',
    alignSelf: 'center',
    width: 317,
    maxWidth: '92%',
    alignItems: 'center',
    gap: 14,
    paddingTop: EllaSpacing.md,
    paddingHorizontal: EllaSpacing.md,
    paddingBottom: EllaSpacing.xl,
    borderWidth: 1,
    borderColor: Frame.cardBorder,
    borderRadius: 17,
    backgroundColor: EllaColors.canvas,
    shadowColor: EllaColors.contentInk,
    shadowOpacity: 0.08,
    shadowRadius: 27,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  cardTitle: {
    fontFamily: EllaFonts.interBold,
    fontSize: 14,
    letterSpacing: 0.84,
    color: EllaColors.contentInk,
    textAlign: 'center',
  },
  cardText: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 14,
    letterSpacing: 0.84,
    color: Frame.secondaryText,
    textAlign: 'center',
  },
  recordButton: {
    alignSelf: 'stretch',
    height: 70,
  },
  // design.md `caption` in `semantic-success`: the consent logged on this visit.
  consentNote: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
    color: EllaColors.semanticSuccess,
    textAlign: 'center',
  },
  micBlocked: {
    alignItems: 'center',
    gap: EllaSpacing.xxs,
  },
  // design.md `caption` (12 / 16).
  micNote: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
    color: EllaColors.semanticError,
    textAlign: 'center',
  },
  micLink: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 14,
    color: EllaColors.ellaBlue,
    textDecorationLine: 'underline',
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    gap: EllaSpacing.md,
    paddingTop: EllaSpacing.section,
  },
});
