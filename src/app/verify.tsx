import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AuthBackground,
  AuthColors,
  HOME_INDICATOR_HEIGHT,
  PrimaryButton,
  STATUS_BAR_HEIGHT,
} from '@/components/auth-screen';
import { EllaLogo } from '@/components/ella-logo';
import { OtpInput } from '@/components/otp-input';
import { EllaColors, EllaFonts, EllaSpacing } from '@/constants/ella-tokens';

// UI-only flow: there is no backend, and this is the only code that verifies.
const TEST_CODE = '123456';
const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;
const VERIFY_DELAY_MS = 1200;

// Cell size measured from the Figma OTP frame (smaller than the design.md component).
const CELL_WIDTH = 49;
const CELL_HEIGHT = 62;

function changeEmail() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/login');
  }
}

export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'error'>('idle');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const verifyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const verifying = status === 'verifying';

  useEffect(() => {
    if (secondsLeft === 0) return;
    const tick = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(tick);
  }, [secondsLeft]);

  useEffect(() => () => clearTimeout(verifyTimer.current), []);

  function handleChange(next: string) {
    setCode(next);
    if (status === 'error') setStatus('idle');
  }

  function handleVerify() {
    setStatus('verifying');
    verifyTimer.current = setTimeout(() => {
      if (code === TEST_CODE) {
        router.dismissAll();
        router.replace({ pathname: '/welcome', params: email ? { email } : {} });
      } else {
        setStatus('error');
      }
    }, VERIFY_DELAY_MS);
  }

  function handleResend() {
    setSecondsLeft(RESEND_SECONDS);
    setCode('');
    setStatus('idle');
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <AuthBackground />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, STATUS_BAR_HEIGHT) + 48,
            paddingBottom: Math.max(insets.bottom, HOME_INDICATOR_HEIGHT),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <EllaLogo />

        <View style={styles.form}>
          <Text style={styles.title}>Enter your code to log in</Text>

          <View>
            <Text style={styles.subtitle}>Enter the {CODE_LENGTH}-digit code we sent to</Text>
            {email ? <Text style={styles.email}>{email}</Text> : null}
          </View>

          <View style={styles.codeGroup}>
            <OtpInput
              value={code}
              onChange={handleChange}
              length={CODE_LENGTH}
              error={status === 'error'}
              disabled={verifying}
              cellWidth={CELL_WIDTH}
              cellHeight={CELL_HEIGHT}
              autoFocus
            />
            {status === 'error' && (
              <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
                That code isn’t right. Check it and try again.
              </Text>
            )}
          </View>

          <View style={styles.links}>
            {secondsLeft > 0 ? (
              <Text style={styles.resend}>resend code in 0:{String(secondsLeft).padStart(2, '0')}s</Text>
            ) : (
              <Text style={styles.link} onPress={handleResend} accessibilityRole="link">
                Resend code
              </Text>
            )}
            <Text style={styles.link} onPress={changeEmail} accessibilityRole="link">
              Change email
            </Text>
          </View>
        </View>

        {/* Pushes the button and terms to the bottom of the screen. */}
        <View style={styles.spacer} />

        <View style={styles.footer}>
          <View style={styles.buttonWrap}>
            <PrimaryButton
              label="Continue"
              onPress={handleVerify}
              disabled={code.length < CODE_LENGTH}
              loading={verifying}
            />
          </View>

          <View style={styles.termsWrap}>
            <Text style={styles.terms}>
              By continuing, you agree to ELLA’s{' '}
              <Text style={styles.termsLink} accessibilityRole="link">
                Clinician Terms & Conditions
              </Text>{' '}
              and{' '}
              <Text style={styles.termsLink} accessibilityRole="link">
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: EllaColors.canvas,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
  },
  form: {
    width: CELL_WIDTH * CODE_LENGTH + 5 * (CODE_LENGTH - 1),
    maxWidth: '92%',
    marginTop: 34,
    alignItems: 'center',
    gap: 23,
  },
  title: {
    fontFamily: EllaFonts.displayMedium,
    fontSize: 24,
    color: EllaColors.contentInk,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: EllaFonts.displayRoman,
    fontSize: 16,
    lineHeight: 24,
    color: AuthColors.subtitle,
    textAlign: 'center',
  },
  email: {
    fontFamily: EllaFonts.displayMedium,
    fontSize: 16,
    lineHeight: 24,
    color: EllaColors.contentBody,
    textAlign: 'center',
  },
  codeGroup: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: EllaSpacing.xs,
  },
  // design.md `caption` (12px / 16px Inter Regular) in `semantic-error`.
  error: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
    color: EllaColors.semanticError,
    textAlign: 'center',
  },
  links: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resend: {
    fontFamily: EllaFonts.displayRoman,
    fontSize: 14,
    lineHeight: 20,
    color: AuthColors.subtitle,
  },
  link: {
    fontFamily: EllaFonts.displayRoman,
    fontSize: 14,
    lineHeight: 20,
    color: AuthColors.secondary,
    textDecorationLine: 'underline',
  },
  spacer: {
    flex: 1,
    minHeight: EllaSpacing.section,
  },
  footer: {
    width: '100%',
    maxWidth: 393,
  },
  buttonWrap: {
    paddingHorizontal: EllaSpacing.xl,
    paddingVertical: EllaSpacing.md,
  },
  termsWrap: {
    paddingHorizontal: EllaSpacing.xl,
    paddingVertical: EllaSpacing.md,
  },
  terms: {
    fontFamily: EllaFonts.displayRoman,
    fontSize: 14,
    lineHeight: 20,
    color: AuthColors.secondary,
    textAlign: 'center',
  },
  termsLink: {
    fontFamily: EllaFonts.displayMedium,
    color: AuthColors.link,
    textDecorationLine: 'underline',
  },
});
