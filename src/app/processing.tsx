import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBackground, AuthColors, PrimaryButton, STATUS_BAR_HEIGHT } from '@/components/auth-screen';
import { EllaLogo } from '@/components/ella-logo';
import { EllaColors, EllaFonts, EllaSpacing } from '@/constants/ella-tokens';
import { formatElapsed, useRecording } from '@/lib/recording-log';

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/home');
  }
}

/** Placeholder after "End and save" on the recording screen, until processing is built. */
export default function ProcessingScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const recording = useRecording(id);
  const notes = recording?.notes.length ?? 0;

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, STATUS_BAR_HEIGHT) + 48 }]}>
      <StatusBar style="dark" />
      <AuthBackground />
      <EllaLogo />

      <View style={styles.column}>
        <View style={styles.headings}>
          <Text style={styles.title} accessibilityRole="header">
            Coming soon
          </Text>
          <Text style={styles.subtitle}>Processing recordings into notes isn’t available yet.</Text>
          {recording?.endedAt && (
            <Text style={styles.saved}>
              Recording saved · {formatElapsed(recording.durationMs)}
              {notes > 0 && ` · ${notes} ${notes === 1 ? 'note' : 'notes'}`}
            </Text>
          )}
        </View>

        <View style={styles.buttonWrap}>
          <PrimaryButton label="Back to visit" onPress={goBack} />
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
  saved: {
    marginTop: EllaSpacing.xs,
    fontFamily: EllaFonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
    color: EllaColors.semanticSuccess,
    textAlign: 'center',
  },
  buttonWrap: {
    alignSelf: 'stretch',
    paddingHorizontal: EllaSpacing.xl,
    paddingVertical: EllaSpacing.md,
  },
});
