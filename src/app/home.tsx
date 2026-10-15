import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBackground, AuthColors, PrimaryButton, STATUS_BAR_HEIGHT } from '@/components/auth-screen';
import { EllaLogo } from '@/components/ella-logo';
import { EllaColors, EllaFonts, EllaSpacing } from '@/constants/ella-tokens';

/** Placeholder landing screen after a successful sign-in. */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, STATUS_BAR_HEIGHT) + 48 }]}>
      <StatusBar style="dark" />
      <AuthBackground />
      <EllaLogo />

      <View style={styles.column}>
        <View style={styles.headings}>
          <Text style={styles.title}>Home</Text>
          <Text style={styles.subtitle}>You’re signed in. This screen is a placeholder.</Text>
        </View>

        <View style={styles.buttonWrap}>
          <PrimaryButton label="Sign out" onPress={() => router.replace('/login')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: EllaColors.canvas,
  },
  column: {
    width: '100%',
    maxWidth: 393,
    marginTop: 34,
    alignItems: 'center',
    gap: 23,
  },
  headings: {
    width: 330,
    maxWidth: '92%',
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
  buttonWrap: {
    alignSelf: 'stretch',
    paddingHorizontal: EllaSpacing.xl,
    paddingVertical: EllaSpacing.md,
  },
});
