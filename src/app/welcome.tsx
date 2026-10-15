import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthColors, HOME_INDICATOR_HEIGHT, PrimaryButton, STATUS_BAR_HEIGHT } from '@/components/auth-screen';
import { EllaColors, EllaFonts, EllaSpacing } from '@/constants/ella-tokens';
import { doctorNameFromEmail } from '@/lib/doctor-name';
import {
  getPermission,
  IS_SIMULATED,
  requestPermission,
  type PermissionKind,
  type PermissionState,
} from '@/lib/permissions';

type Row = {
  kind: PermissionKind;
  title: string;
  optional?: boolean;
  icon: number;
  // Shown in the simulated web prompt; mirrors the native permission strings.
  promptTitle: string;
  promptBody: string;
};

const ROWS: Row[] = [
  {
    kind: 'microphone',
    title: 'Allow microphone access',
    icon: require('@/assets/images/welcome/mic.svg'),
    promptTitle: '“Ella” Would Like to Access the Microphone',
    promptBody: 'Ella uses the microphone to record your patient visits.',
  },
  {
    kind: 'notifications',
    title: 'Allow notifications',
    icon: require('@/assets/images/welcome/bell.svg'),
    promptTitle: '“Ella” Would Like to Send You Notifications',
    promptBody: 'Notifications may include alerts, sounds, and icon badges.',
  },
  {
    kind: 'calendar',
    title: 'Connect your calendar',
    optional: true,
    icon: require('@/assets/images/welcome/calendar.svg'),
    promptTitle: '“Ella” Would Like to Access Your Calendar',
    promptBody: 'Ella uses your calendar to show your upcoming patient visits.',
  },
];

const CHECK_ICON = require('@/assets/images/welcome/check.svg');

// Measured from the Figma welcome frame; no design.md token for these.
const ICON_BUTTON_SIZE = 54;
const ICON_BUTTON_GRANTED = 'rgba(5,177,105,0.12)'; // semantic-success at 12%

type States = Record<PermissionKind, PermissionState>;

const INITIAL: States = { microphone: 'undetermined', notifications: 'undetermined', calendar: 'undetermined' };

function openPrivacy() {
  router.push('/privacy');
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const doctorName = doctorNameFromEmail(email);

  const [states, setStates] = useState<States>(INITIAL);
  const [prompt, setPrompt] = useState<Row | null>(null);
  const promptResolve = useRef<((granted: boolean) => void) | undefined>(undefined);

  function setState(kind: PermissionKind, state: PermissionState) {
    setStates((s) => ({ ...s, [kind]: state }));
  }

  // Read current permissions, and again when returning from the Settings app.
  useEffect(() => {
    if (IS_SIMULATED) return;

    async function refresh() {
      for (const { kind } of ROWS) {
        try {
          setState(kind, await getPermission(kind));
        } catch {
          // Leave the row tappable if the status can't be read.
        }
      }
    }

    refresh();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });
    return () => sub.remove();
  }, []);

  function askSimulated(row: Row) {
    return new Promise<boolean>((resolve) => {
      promptResolve.current = resolve;
      setPrompt(row);
    });
  }

  function answerSimulated(granted: boolean) {
    setPrompt(null);
    promptResolve.current?.(granted);
    promptResolve.current = undefined;
  }

  async function ask(row: Row) {
    if (states[row.kind] === 'granted') return;

    if (IS_SIMULATED) {
      setState(row.kind, (await askSimulated(row)) ? 'granted' : 'denied');
      return;
    }

    try {
      setState(row.kind, await requestPermission(row.kind));
    } catch {
      setState(row.kind, 'denied');
    }
  }

  function openSettings(row: Row) {
    // The browser can't open OS settings, so the preview asks again instead.
    if (IS_SIMULATED) {
      ask(row);
    } else {
      Linking.openSettings();
    }
  }

  function handleContinue() {
    router.dismissAll();
    router.replace('/home');
  }

  const descriptions: Record<PermissionKind, ReactNode> = {
    microphone: (
      <>
        Ella turns your visit into a draft note. Recording starts only when you tap Start. (See our{' '}
        <Text style={styles.link} onPress={openPrivacy} accessibilityRole="link">
          Privacy Policy
        </Text>
        .)
      </>
    ),
    notifications: 'Know when notes are ready or need your sign-off.',
    calendar: 'Match every note to the right patient and visit.',
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, STATUS_BAR_HEIGHT) + 66,
            paddingBottom: Math.max(insets.bottom, HOME_INDICATOR_HEIGHT),
          },
        ]}>
        <Text style={styles.title} accessibilityRole="header">
          Welcome to Ella,{'\n'}
          {doctorName}
        </Text>

        <View style={styles.rows}>
          {ROWS.map((row, i) => (
            <Fragment key={row.kind}>
              {i > 0 && <View style={styles.divider} />}
              <PermissionRow
                row={row}
                description={descriptions[row.kind]}
                state={states[row.kind]}
                onAsk={() => ask(row)}
                onOpenSettings={() => openSettings(row)}
              />
            </Fragment>
          ))}
        </View>

        {/* Pushes the button to the bottom of the screen. */}
        <View style={styles.spacer} />

        <PrimaryButton
          label="Continue"
          onPress={handleContinue}
          disabled={states.microphone !== 'granted'}
        />
      </ScrollView>

      {IS_SIMULATED && (
        <Modal visible={prompt !== null} transparent animationType="fade" onRequestClose={() => answerSimulated(false)}>
          <View style={styles.backdrop}>
            <View style={styles.alert} accessibilityRole="alert">
              <View style={styles.alertBody}>
                <Text style={styles.alertTag}>Simulated system prompt</Text>
                <Text style={styles.alertTitle}>{prompt?.promptTitle}</Text>
                <Text style={styles.alertMessage}>{prompt?.promptBody}</Text>
              </View>
              <View style={styles.alertButtons}>
                <Pressable
                  onPress={() => answerSimulated(false)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.alertButton, pressed && styles.alertPressed]}>
                  <Text style={styles.alertButtonText}>Don’t Allow</Text>
                </Pressable>
                <View style={styles.alertDivider} />
                <Pressable
                  onPress={() => answerSimulated(true)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.alertButton, pressed && styles.alertPressed]}>
                  <Text style={[styles.alertButtonText, styles.alertButtonPrimary]}>Allow</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

type PermissionRowProps = {
  row: Row;
  description: ReactNode;
  state: PermissionState;
  onAsk: () => void;
  onOpenSettings: () => void;
};

function PermissionRow({ row, description, state, onAsk, onOpenSettings }: PermissionRowProps) {
  const granted = state === 'granted';
  const denied = state === 'denied';
  const stateLabel = granted ? 'Allowed' : denied ? 'Not allowed' : 'Tap to allow';

  return (
    <View style={styles.row}>
      <Pressable onPress={onAsk} disabled={granted} style={styles.rowText} accessible={false}>
        <Text style={styles.rowTitle}>
          {row.title}
          {row.optional && <Text style={styles.optional}> (optional)</Text>}
        </Text>
        <Text style={styles.rowDescription}>{description}</Text>
        {denied && (
          <Text style={styles.denied}>
            Access was denied.{' '}
            <Text style={styles.link} onPress={onOpenSettings} accessibilityRole="link">
              Open settings
            </Text>
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={onAsk}
        disabled={granted}
        accessibilityRole="button"
        accessibilityLabel={`${row.title}${row.optional ? ', optional' : ''}. ${stateLabel}`}
        accessibilityState={{ disabled: granted, checked: granted }}
        hitSlop={8}
        style={({ pressed }) => [
          styles.iconButton,
          granted && styles.iconButtonGranted,
          pressed && styles.pressed,
        ]}>
        {/* Keyed so the icon swaps instantly instead of cross-fading. */}
        <Image key={granted ? 'check' : row.kind} source={granted ? CHECK_ICON : row.icon} style={styles.icon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AuthColors.floor,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 393,
    alignSelf: 'center',
    paddingHorizontal: EllaSpacing.xl,
  },
  // design.md `Headline` (28 / 38) in `Ella Blue`; bold to match the frame.
  title: {
    fontFamily: EllaFonts.interBold,
    fontSize: 28,
    lineHeight: 38,
    color: EllaColors.ellaBlue,
  },
  rows: {
    marginTop: EllaSpacing.section,
  },
  divider: {
    height: 1,
    backgroundColor: AuthColors.hairline,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: EllaSpacing.md,
    paddingVertical: EllaSpacing.lg,
  },
  rowText: {
    flex: 1,
    gap: EllaSpacing.xxs,
  },
  rowTitle: {
    fontFamily: EllaFonts.interBold,
    fontSize: 14,
    letterSpacing: 0.84,
    color: EllaColors.contentInk,
  },
  optional: {
    fontFamily: EllaFonts.interRegular,
    fontStyle: 'italic',
    color: EllaColors.contentMuted,
  },
  rowDescription: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.84,
    color: EllaColors.contentBody,
  },
  link: {
    color: AuthColors.link,
    textDecorationLine: 'underline',
  },
  // design.md `caption` (12px / 16px Inter Regular).
  denied: {
    marginTop: EllaSpacing.xxs,
    fontFamily: EllaFonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
    color: EllaColors.contentMuted,
  },
  iconButton: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: ICON_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AuthColors.buttonIdle,
  },
  iconButtonGranted: {
    backgroundColor: ICON_BUTTON_GRANTED,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    width: 22,
    height: 22,
  },
  spacer: {
    flex: 1,
    minHeight: EllaSpacing.section,
  },
  // Simulated iOS permission alert (web preview only).
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  alert: {
    width: 270,
    borderRadius: 14,
    backgroundColor: 'rgba(242,242,247,0.98)',
    overflow: 'hidden',
  },
  alertBody: {
    paddingHorizontal: EllaSpacing.md,
    paddingTop: EllaSpacing.lg,
    paddingBottom: EllaSpacing.md,
    gap: EllaSpacing.xxs,
  },
  alertTag: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 11,
    color: EllaColors.contentMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertTitle: {
    fontFamily: EllaFonts.interBold,
    fontSize: 17,
    lineHeight: 22,
    color: EllaColors.contentInk,
    textAlign: 'center',
  },
  alertMessage: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 13,
    lineHeight: 18,
    color: EllaColors.contentInk,
    textAlign: 'center',
  },
  alertButtons: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60,60,67,0.29)',
  },
  alertButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertPressed: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  alertDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(60,60,67,0.29)',
  },
  alertButtonText: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 17,
    color: '#007AFF',
  },
  alertButtonPrimary: {
    fontFamily: EllaFonts.interBold,
  },
});
