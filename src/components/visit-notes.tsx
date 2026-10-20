import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { HOME_INDICATOR_HEIGHT } from '@/components/auth-screen';
import { EllaColors, EllaFonts, EllaSpacing } from '@/constants/ella-tokens';
import { formatElapsed, type RecordingNote } from '@/lib/recording-log';

// The time chip reuses the transcript frame's "time" chip (Figma 296:8068); no design.md token.
const Frame = {
  chipFill: '#E7EBEE',
  chipText: '#565656',
  divider: 'rgba(0,0,0,0.08)',
} as const;

/** Notes the doctor added with "Add Note" while recording, each at its recording time. */
export function VisitNotes({ notes }: { notes: RecordingNote[] }) {
  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {notes.map((note, i) => (
        <View key={`${note.atMs}-${i}`} style={[styles.note, i > 0 && styles.divided]}>
          <View style={styles.chip}>
            <Text style={styles.chipText} accessibilityLabel={`At ${formatElapsed(note.atMs)} into the recording`}>
              {formatElapsed(note.atMs)}
            </Text>
          </View>
          <Text style={styles.text}>{note.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingTop: EllaSpacing.xl,
    paddingHorizontal: 29,
    paddingBottom: EllaSpacing.section + HOME_INDICATOR_HEIGHT,
  },
  note: {
    alignItems: 'flex-start',
    gap: 7,
    paddingVertical: EllaSpacing.md,
  },
  divided: {
    borderTopWidth: 1,
    borderTopColor: Frame.divider,
  },
  chip: {
    padding: EllaSpacing.xxs,
    backgroundColor: Frame.chipFill,
  },
  chipText: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 10,
    letterSpacing: 0.6,
    color: Frame.chipText,
  },
  text: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.96,
    color: EllaColors.contentBody,
  },
});
