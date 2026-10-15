import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBackground, AuthColors, PrimaryButton, STATUS_BAR_HEIGHT } from '@/components/auth-screen';
import { EllaLogo } from '@/components/ella-logo';
import { EllaColors, EllaFonts, EllaRadius, EllaSpacing } from '@/constants/ella-tokens';

const WORK_EMAIL_DOMAIN = '@mayo.edu';

/** Any address ending in @mayo.edu with something before the @; case- and padding-insensitive. */
function isWorkEmail(value: string) {
  const email = value.trim().toLowerCase();
  return email.endsWith(WORK_EMAIL_DOMAIN) && email.length > WORK_EMAIL_DOMAIN.length;
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [showError, setShowError] = useState(false);
  const canContinue = email.trim().length > 0;

  function handleChange(next: string) {
    setEmail(next);
    setShowError(false);
  }

  function handleContinue() {
    if (!canContinue) return;
    if (!isWorkEmail(email)) {
      setShowError(true);
      return;
    }
    router.push({ pathname: '/verify', params: { email: email.trim() } });
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <AuthBackground />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, STATUS_BAR_HEIGHT) + 48, paddingBottom: insets.bottom + EllaSpacing.md },
        ]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <EllaLogo />

        <View style={styles.column}>
          <View style={styles.formGroup}>
            <View style={styles.form}>
              <View style={styles.headings}>
                <Text style={styles.title}>Log in with your work email</Text>
                <Text style={styles.subtitle}>Use your clinic login or scan code from Ella.</Text>
              </View>

              <View style={styles.field}>
                <TextInput
                  value={email}
                  onChangeText={handleChange}
                  onSubmitEditing={handleContinue}
                  submitBehavior="submit"
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="name@mayo.edu"
                  placeholderTextColor={EllaColors.contentMuted}
                  keyboardType="email-address"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="go"
                  accessibilityLabel="Work email"
                  accessibilityHint={showError ? 'Use your Mayo Clinic email (name@mayo.edu)' : undefined}
                  aria-invalid={showError}
                  style={[styles.input, focused && styles.inputFocused, showError && styles.inputError]}
                />
                {showError && (
                  <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
                    Use your Mayo Clinic email (name@mayo.edu)
                  </Text>
                )}
              </View>

              <Text style={styles.helpLink} accessibilityRole="link">
                Where can I find my access code?
              </Text>
            </View>

            <View style={styles.buttonWrap}>
              <PrimaryButton label="Continue" onPress={handleContinue} disabled={!canContinue} />
            </View>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={() => router.push('/scan')}
            accessibilityRole="button"
            accessibilityLabel="Scan QR code. Already signed in on your computer. Scan to connect."
            style={({ pressed }) => [styles.qrCard, pressed && styles.pressed]}>
            <View style={styles.qrTile}>
              <Image source={require('@/assets/images/login/scan-qr.svg')} style={styles.qrIcon} />
            </View>
            <View style={styles.qrText}>
              <Text style={styles.qrTitle}>Scan QR code</Text>
              <Text style={styles.qrBody}>Already signed in on your computer. Scan to connect.</Text>
            </View>
            <Image source={require('@/assets/images/login/chevron-right.svg')} style={styles.chevron} />
          </Pressable>

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
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: 393,
    marginTop: 34,
    alignItems: 'center',
    gap: 14,
  },
  formGroup: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 23,
  },
  form: {
    width: 330,
    maxWidth: '92%',
    alignItems: 'center',
    gap: 23,
  },
  headings: {
    alignSelf: 'stretch',
    gap: EllaSpacing.xxs,
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
    color: AuthColors.subtitle,
    textAlign: 'center',
  },
  input: {
    alignSelf: 'stretch',
    height: 50,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: AuthColors.inputBorder,
    borderRadius: EllaRadius.md,
    backgroundColor: EllaColors.canvas,
    fontFamily: EllaFonts.interMedium,
    fontSize: 16,
    letterSpacing: 0.96,
    color: EllaColors.contentInk,
  },
  inputFocused: {
    borderColor: EllaColors.ellaBlue,
  },
  inputError: {
    borderColor: EllaColors.semanticError,
  },
  field: {
    alignSelf: 'stretch',
    gap: EllaSpacing.xs,
  },
  // design.md `caption` (12px / 16px Inter Regular) in `semantic-error`.
  error: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
    color: EllaColors.semanticError,
  },
  helpLink: {
    alignSelf: 'stretch',
    fontFamily: EllaFonts.displayRoman,
    fontSize: 14,
    color: AuthColors.secondary,
    textAlign: 'center',
  },
  buttonWrap: {
    alignSelf: 'stretch',
    paddingHorizontal: EllaSpacing.xl,
    paddingVertical: EllaSpacing.md,
  },
  pressed: {
    opacity: 0.8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 23,
    gap: 7,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AuthColors.hairline,
  },
  dividerLabel: {
    fontFamily: EllaFonts.displayRoman,
    fontSize: 14,
    lineHeight: 20,
    color: AuthColors.secondary,
    textAlign: 'center',
  },
  qrCard: {
    width: 338,
    maxWidth: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: EllaSpacing.md,
    borderWidth: 1,
    borderColor: AuthColors.hairline,
    borderRadius: EllaRadius.lg,
    backgroundColor: EllaColors.canvas,
  },
  qrTile: {
    width: 65.778,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: EllaRadius.lg,
    backgroundColor: AuthColors.scanTile,
  },
  qrIcon: {
    width: 39.111,
    height: 39.111,
  },
  qrText: {
    flex: 1,
    gap: EllaSpacing.xxs,
  },
  qrTitle: {
    fontFamily: EllaFonts.interBold,
    fontSize: 14,
    letterSpacing: 0.84,
    color: EllaColors.contentInk,
  },
  qrBody: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.84,
    color: EllaColors.contentBody,
  },
  chevron: {
    width: 8,
    height: 14,
    marginHorizontal: -1,
  },
  termsWrap: {
    alignSelf: 'stretch',
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
