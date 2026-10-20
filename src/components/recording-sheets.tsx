import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HOME_INDICATOR_HEIGHT, PrimaryButton, SecondaryButton } from '@/components/auth-screen';
import { EllaColors, EllaFonts, EllaRadius, EllaSpacing } from '@/constants/ella-tokens';

// Not in the recording frames; these reuse the consent sheet's look (Figma 164:4784) so the
// overlays in the recording flow match.
const Frame = {
  scrim: 'rgba(15,5,5,0.6)',
  handle: '#E7EAF6',
  secondaryText: '#606D75',
  cardBorder: 'rgba(151,143,237,0.34)',
} as const;
const SHEET_RADIUS = 33;
const CONTENT_WIDTH = 362;

type AddNoteSheetProps = {
  /** Recording time the note belongs to, e.g. "00:03:12". */
  timestamp: string;
  onSave: (text: string) => void;
  onClose: () => void;
};

/** Quick note taken during a recording. Recording keeps going underneath. */
export function AddNoteSheet({ timestamp, onSave, onClose }: AddNoteSheetProps) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const note = text.trim();

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close without saving" />
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap} pointerEvents="box-none">
        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          exiting={SlideOutDown}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, HOME_INDICATOR_HEIGHT) }]}
          accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.content}>
            <View style={styles.heading}>
              <Text style={styles.title} accessibilityRole="header">
                Add a note
              </Text>
              <Text style={styles.caption}>Saved at {timestamp} · recording continues</Text>
            </View>
            <TextInput
              value={text}
              onChangeText={setText}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Type a quick note"
              placeholderTextColor={EllaColors.contentMuted}
              multiline
              autoFocus
              accessibilityLabel="Note"
              style={[styles.input, focused && styles.inputFocused]}
            />
            <PrimaryButton label="Save note" onPress={() => onSave(note)} disabled={!note} style={styles.button} />
            <SecondaryButton label="Cancel" onPress={onClose} style={styles.button} />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type EndRecordingDialogProps = {
  ending: boolean;
  onEnd: () => void;
  onKeep: () => void;
};

/** Confirms before a recording ends, so nothing is lost by accident. */
export function EndRecordingDialog({ ending, onEnd, onKeep }: EndRecordingDialogProps) {
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onKeep}>
      <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.scrim, styles.center]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onKeep} accessibilityLabel="Keep recording" />
        <Animated.View entering={ZoomIn.duration(180)} style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
          <Text style={styles.title} accessibilityRole="header">
            End recording?
          </Text>
          <Text style={styles.body}>The recording and your notes will be saved for this visit.</Text>
          <PrimaryButton label="End and save" onPress={onEnd} loading={ending} style={styles.button} />
          <SecondaryButton label="Keep recording" onPress={onKeep} style={styles.button} />
        </Animated.View>
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: EllaSpacing.xl,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    alignItems: 'center',
    paddingTop: EllaSpacing.md,
    gap: EllaSpacing.md,
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
    width: CONTENT_WIDTH,
    maxWidth: '100%',
    gap: EllaSpacing.sm,
    paddingHorizontal: EllaSpacing.sm,
  },
  heading: {
    gap: EllaSpacing.xxs,
  },
  title: {
    fontFamily: EllaFonts.interBold,
    fontSize: 16,
    letterSpacing: 0.96,
    color: EllaColors.contentInk,
    textAlign: 'center',
  },
  // design.md `caption`.
  caption: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
    color: EllaColors.contentMuted,
    textAlign: 'center',
  },
  // design.md Input field, taller for a few lines of text.
  input: {
    minHeight: 96,
    maxHeight: 180,
    padding: EllaSpacing.md,
    borderWidth: 1,
    borderColor: EllaColors.contentSoft,
    borderRadius: EllaRadius.md,
    fontFamily: EllaFonts.interRegular,
    fontSize: 16,
    lineHeight: 24,
    color: EllaColors.contentBody,
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: EllaColors.ellaBlue,
  },
  button: {
    alignSelf: 'stretch',
  },
  card: {
    width: 317,
    maxWidth: '100%',
    alignItems: 'center',
    gap: EllaSpacing.sm,
    padding: EllaSpacing.lg,
    borderWidth: 1,
    borderColor: Frame.cardBorder,
    borderRadius: 17,
    backgroundColor: EllaColors.canvas,
  },
  body: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 14,
    letterSpacing: 0.84,
    color: Frame.secondaryText,
    textAlign: 'center',
    marginBottom: EllaSpacing.xxs,
  },
});
