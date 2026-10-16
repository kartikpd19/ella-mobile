import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthColors } from '@/components/auth-screen';
import { EllaColors, EllaFonts, EllaSpacing } from '@/constants/ella-tokens';
import type { NoteStatus, Visit, VisitStatus } from '@/lib/sample-visits';

// The Figma Recording Status component's icon; only the Draft one exists in the file so far.
const DRAFT_ICON = require('@/assets/images/visit/status-draft.png');

// design.md › Status ring — `status-color ring` bar colors.
const RING_COLORS: Record<VisitStatus, string> = {
  Scheduled: EllaColors.accentsBlue,
  Arrived: '#887EE2',
  Waiting: EllaColors.accentsPurple,
  Rooming: EllaColors.accentsPink,
  Consultation: EllaColors.accentsYellow,
  Complete: '#059655',
  'No-show': '#808080',
};

// design.md › Badges — `Recording Status` variants.
const BADGES: Record<NoteStatus, { background: string; text: string; border?: string; label: string }> = {
  Draft: { background: '#F3F4F8', text: '#3A4050', label: 'Draft' },
  'In Progress': { background: '#FCEFD4', text: '#F17A29', label: 'In Progress' },
  'In-review': { background: '#F3F0FF', text: '#1F54E1', label: 'In-review' },
  Imported: { background: '#ECFDF3', text: '#059655', label: 'Imported' },
  Canceled: { background: 'rgba(212,213,218,0.55)', text: 'rgba(58,64,80,0.62)', border: 'rgba(0,0,0,0.4)', label: 'Canceled' },
};

type BadgeStyle = { background: string; text: string; border?: string; label: string };

/**
 * The visit's `Recording Status` badge. With `fallbackToAppointment`, visits that have no
 * note yet show their appointment status instead (tinted with its status color).
 */
export function StatusBadge({ visit, fallbackToAppointment = false }: { visit: Visit; fallbackToAppointment?: boolean }) {
  let badge: BadgeStyle | undefined = visit.note ? BADGES[visit.note] : undefined;
  if (!badge && fallbackToAppointment) {
    const color = RING_COLORS[visit.status];
    badge = { background: `${color}1F`, text: color, label: visit.status }; // 1F ≈ 12% alpha
  }
  if (!badge) return null;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: badge.background },
        badge.border ? { borderWidth: 1, borderStyle: 'dashed', borderColor: badge.border } : null,
      ]}>
      {visit.note === 'Draft' && <Image source={DRAFT_ICON} style={styles.badgeIcon} />}
      <Text style={[styles.badgeLabel, { color: badge.text }]}>{badge.label}</Text>
    </View>
  );
}

export function VisitRow({ visit, onPress }: { visit: Visit; onPress?: () => void }) {
  const ring = RING_COLORS[visit.status];
  const note = visit.note ? BADGES[visit.note].label : undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${visit.patient}, ${visit.time}, ${visit.reason}. ${visit.status}${note ? `. Note ${note}` : ''}`}
      accessibilityHint="Opens the visit detail"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.statusBar, { backgroundColor: ring }]} />

      <View style={styles.text}>
        <Text style={styles.patient} numberOfLines={1}>
          {visit.patient}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {visit.time} · {visit.reason} · {visit.status}
        </Text>
      </View>

      <StatusBadge visit={visit} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: EllaSpacing.sm,
    paddingVertical: EllaSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AuthColors.hairline,
  },
  // design.md status bar (4×15), drawn without the ring, as in the Figma visit list.
  statusBar: {
    width: 4,
    height: 15,
    marginRight: EllaSpacing.xxs,
    borderRadius: 2,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  patient: {
    fontFamily: EllaFonts.interBold,
    fontSize: 14,
    letterSpacing: 0.84,
    color: EllaColors.contentInk,
  },
  // design.md `caption` (12 / 16) in `Content-muted`.
  meta: {
    fontFamily: EllaFonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
    color: EllaColors.contentMuted,
  },
  // design.md: height 24, padding 4 × 8, radius 16.
  pressed: {
    opacity: 0.6,
  },
  // design.md: height 24, padding 4 × 8, radius 16, gap 4.
  badge: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: EllaSpacing.xxs,
    paddingHorizontal: EllaSpacing.xs,
    borderRadius: 16,
  },
  badgeIcon: {
    width: 14,
    height: 14,
  },
  badgeLabel: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 12,
  },
});
