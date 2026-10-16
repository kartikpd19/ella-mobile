import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { EllaColors, EllaFonts, EllaSpacing } from '@/constants/ella-tokens';
import { rememberSimulated, type PermissionKind } from '@/lib/permissions';

// Mirrors the real system prompts; iOS messages come from app.json.
const PROMPTS: Record<PermissionKind, { title: string; message: string }> = {
  microphone: {
    title: '“Ella” Would Like to Access the Microphone',
    message: 'Ella uses the microphone to record your patient visits.',
  },
  notifications: {
    title: '“Ella” Would Like to Send You Notifications',
    message: 'Notifications may include alerts, sounds, and icon badges.',
  },
  calendar: {
    title: '“Ella” Would Like to Access Your Calendar',
    message: 'Ella uses your calendar to show your upcoming patient visits.',
  },
};

/**
 * iOS-style permission alert for the web preview, where real OS prompts don't exist.
 * `ask(kind)` shows it and resolves with the answer; the answer is remembered so other
 * screens see the same permission state. Render `prompt` once in the screen.
 */
export function useSimulatedPermissionPrompt() {
  const [kind, setKind] = useState<PermissionKind | null>(null);
  const resolver = useRef<((granted: boolean) => void) | undefined>(undefined);

  function ask(next: PermissionKind) {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setKind(next);
    });
  }

  function answer(granted: boolean) {
    if (kind) rememberSimulated(kind, granted ? 'granted' : 'denied');
    setKind(null);
    resolver.current?.(granted);
    resolver.current = undefined;
  }

  const copy = kind ? PROMPTS[kind] : null;

  const prompt = (
    <Modal visible={kind !== null} transparent animationType="fade" onRequestClose={() => answer(false)}>
      <View style={styles.backdrop}>
        <View style={styles.alert} accessibilityRole="alert">
          <View style={styles.body}>
            <Text style={styles.tag}>Simulated system prompt</Text>
            <Text style={styles.title}>{copy?.title}</Text>
            <Text style={styles.message}>{copy?.message}</Text>
          </View>
          <View style={styles.buttons}>
            <Pressable
              onPress={() => answer(false)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
              <Text style={styles.buttonText}>Don’t Allow</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              onPress={() => answer(true)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
              <Text style={[styles.buttonText, styles.buttonPrimary]}>Allow</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  return { ask, prompt };
}

const styles = StyleSheet.create({
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
  body: {
    paddingHorizontal: EllaSpacing.md,
    paddingTop: EllaSpacing.lg,
    paddingBottom: EllaSpacing.md,
    gap: EllaSpacing.xxs,
  },
  tag: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 11,
    color: EllaColors.contentMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: EllaFonts.interBold,
    fontSize: 17,
    lineHeight: 22,
    color: EllaColors.contentInk,
    textAlign: 'center',
  },
  message: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 13,
    lineHeight: 18,
    color: EllaColors.contentInk,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60,60,67,0.29)',
  },
  button: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(60,60,67,0.29)',
  },
  buttonText: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 17,
    color: '#007AFF', // iOS system blue
  },
  buttonPrimary: {
    fontFamily: EllaFonts.interBold,
  },
});
