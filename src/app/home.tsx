import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetSectionList,
  type BottomSheetHandleProps,
} from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthColors, PrimaryButton, STATUS_BAR_HEIGHT } from '@/components/auth-screen';
import { EllaLogo } from '@/components/ella-logo';
import { UnderlineTabs } from '@/components/underline-tabs';
import { VisitRow } from '@/components/visit-row';
import { EllaColors, EllaFonts, EllaRadius, EllaSpacing } from '@/constants/ella-tokens';
import { currentDoctorName, rememberDoctorEmail } from '@/lib/current-doctor';
import { doctorNameFromEmail } from '@/lib/doctor-name';
import { formatLongDate } from '@/lib/format-date';
import { isPast, SAMPLE_VISITS, type Visit } from '@/lib/sample-visits';
import { setSyncState, useSyncState, type SyncState } from '@/lib/sync-state';

const TABS = ['All', 'Upcoming', 'Past'] as const;
type Tab = (typeof TABS)[number];

const DAY_ORDER: Visit['day'][] = ['Today', 'Tomorrow', 'Yesterday'];

// Measured from the Figma home frames (104:4905, 248:1165, 250:1479); no design.md token for these.
const HEADER_GRADIENT = ['#E7E8F7', '#F1D6E3'] as const; // lavender → pink wash
const AVATAR_SIZE = 42;
const SHEET_HANDLE = '#D9DCE5';
const SEARCH_FILL = '#F3F4F6';
const GRID_LINE = 'rgba(168,172,179,0.14)'; // Content-soft, very faint
const EXPANDED_GAP = EllaSpacing.sm; // space between the top bar and the expanded sheet
const GREETING_MIN_OPACITY = 0.3; // "fades out slightly" once covered
// Fixed header geometry, so snap points are known on the first frame and never shift
// (shifting snap points made the sheet start in the wrong place on web).
const TOP_BAR_HEIGHT = 40.8 + 2 * EllaSpacing.xs; // EllaLogo: 40.8 mark + 8 padding top and bottom
const TITLE_LINE_HEIGHT = 32;
const GREETING_HEIGHT =
  EllaSpacing.xl + 16 + EllaSpacing.xs + 2 * TITLE_LINE_HEIGHT + 48; // date margin + date + gap + 2 title lines + header padding

const SHEET_STATES: SyncState[] = ['empty', 'syncing', 'synced'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { email, state, sheet } = useLocalSearchParams<{ email?: string; state?: string; sheet?: string }>();
  // Coming back from a visit (e.g. after Swipe to Import) arrives without `?email=`, so fall back
  // to the doctor remembered on the first visit. Other screens (the transcript) use it too.
  const doctorName = email ? doctorNameFromEmail(email) : currentDoctorName();
  useEffect(() => rememberDoctorEmail(email), [email]);
  const today = formatLongDate(new Date());

  // `?state=` (used by the preview page) jumps straight to a Home state on first render.
  useState(() => {
    const linked = state === 'list' ? 'synced' : state;
    if (SHEET_STATES.includes(linked as SyncState)) setSyncState(linked as SyncState);
  });
  const syncState = useSyncState();

  const [tab, setTab] = useState<Tab>('All');

  // Collapsed: sheet top just below the greeting. Expanded: just below the top bar.
  const { height: screenHeight } = useWindowDimensions();
  const headerTop = Math.max(insets.top, STATUS_BAR_HEIGHT) + EllaSpacing.md;
  const topBarBottom = headerTop + TOP_BAR_HEIGHT;
  const headerBottom = topBarBottom + GREETING_HEIGHT;

  const snapPoints = useMemo(() => {
    const collapsed = Math.max(screenHeight - headerBottom, 1);
    const expanded = screenHeight - topBarBottom - EXPANDED_GAP;
    return [collapsed, Math.max(expanded, collapsed + 1)];
  }, [screenHeight, topBarBottom, headerBottom]);

  // 0 = collapsed, 1 = expanded; drives the greeting fade.
  const initialIndex = sheet === 'expanded' ? 1 : 0;
  const sheetIndex = useSharedValue(initialIndex);

  const greetingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sheetIndex.value, [0, 1], [1, GREETING_MIN_OPACITY], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(sheetIndex.value, [0, 1], [0, -EllaSpacing.xs], Extrapolation.CLAMP) }],
  }));

  const sections = useMemo(() => {
    const visible = SAMPLE_VISITS.filter((visit) =>
      tab === 'All' ? true : tab === 'Past' ? isPast(visit) : !isPast(visit),
    );
    return DAY_ORDER.map((day) => ({ title: day, data: visible.filter((visit) => visit.day === day) })).filter(
      (section) => section.data.length > 0,
    );
  }, [tab]);

  // Linking the mobile app starts by scanning the QR code shown in Ella on the computer.
  function handleSync() {
    router.push({ pathname: '/scan', params: { from: 'home', ...(email ? { email } : {}) } });
  }

  const bottomPadding = insets.bottom + EllaSpacing.xl;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={HEADER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.header, { paddingTop: headerTop }]}>
        <View style={styles.topBar}>
          <View style={styles.logo}>
            <EllaLogo />
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={10}
              style={({ pressed }) => pressed && styles.pressed}>
              <Image source={require('@/assets/images/home/bell.svg')} style={styles.bell} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Profile"
              style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
              <Image source={require('@/assets/images/home/doctor.svg')} style={styles.avatarIcon} />
            </Pressable>
          </View>
        </View>

        <Animated.View style={greetingStyle}>
          <Text style={styles.date}>{today}</Text>
          {/* Two lines max: the sheet's collapsed position assumes this height. */}
          <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
            Welcome to Ella,{'\n'}
            {doctorName}
          </Text>
        </Animated.View>
      </View>

        <BottomSheet
          // `?sheet=expanded` (preview page) opens the sheet expanded; it starts collapsed otherwise.
          index={initialIndex}
          snapPoints={snapPoints}
          animateOnMount={false}
          animatedIndex={sheetIndex}
          enableDynamicSizing={false}
          enableOverDrag={false}
          enablePanDownToClose={false}
          handleComponent={SheetHandle}
          backgroundStyle={styles.sheetBackground}
          style={styles.sheetShadow}>
          {/* Tabs and Search stay pinned while the content below scrolls. */}
          <View style={styles.toolbar}>
            <UnderlineTabs tabs={TABS} selected={tab} onSelect={setTab} />

            <Pressable
              accessibilityRole="search"
              accessibilityLabel="Search"
              style={({ pressed }) => [styles.search, pressed && styles.pressed]}>
              <Image source={require('@/assets/images/home/search.svg')} style={styles.searchIcon} />
              <Text style={styles.searchLabel}>Search</Text>
            </Pressable>
          </View>

          {syncState === 'synced' ? (
            <BottomSheetSectionList
              sections={sections}
              keyExtractor={(visit: Visit) => visit.id}
              renderItem={({ item }: { item: Visit }) => (
                <VisitRow
                  visit={item}
                  onPress={() => router.push({ pathname: '/visit/[id]', params: { id: item.id } })}
                />
              )}
              renderSectionHeader={({ section }: { section: { title: string } }) => (
                <Text style={styles.sectionHeader} accessibilityRole="header">
                  {section.title}
                </Text>
              )}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }]}
              ListEmptyComponent={<Text style={styles.listEmpty}>No visits here yet.</Text>}
            />
          ) : (
            <BottomSheetScrollView contentContainerStyle={[styles.empty, { paddingBottom: bottomPadding }]}>
              {syncState === 'syncing' ? (
                <View style={styles.syncing} accessibilityLiveRegion="polite">
                  <ActivityIndicator color={EllaColors.ellaBlue} size="large" />
                  <Text style={styles.emptyText}>Syncing your consultations and appointments…</Text>
                </View>
              ) : (
                <>
                  <View style={styles.illustration}>
                    <GridBackdrop />
                    <Image source={require('@/assets/images/home/folder-sync.svg')} style={styles.folder} />
                  </View>

                  <Text style={styles.emptyText}>
                    Connect the Ella mobile app to sync your consultations and appointments.
                  </Text>

                  <View style={styles.syncButton}>
                    <PrimaryButton label="Sync now" onPress={handleSync} />
                  </View>
                </>
              )}
            </BottomSheetScrollView>
          )}
        </BottomSheet>
    </View>
  );
}

/** The sheet's drag handle (the small grey bar). The whole top strip is draggable. */
function SheetHandle(_props: BottomSheetHandleProps) {
  return (
    <View style={styles.handleArea} accessibilityRole="adjustable" accessibilityLabel="Drag to expand or collapse">
      <View style={styles.handle} />
    </View>
  );
}

/** Faint grid behind the empty-state icon, fading out at the edges. */
function GridBackdrop() {
  const columns = 7;
  const rows = 4;
  return (
    <View style={styles.grid} pointerEvents="none">
      {Array.from({ length: columns + 1 }, (_, i) => (
        <View key={`c${i}`} style={[styles.gridLineV, { left: `${(i / columns) * 100}%` }]} />
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <View key={`r${i}`} style={[styles.gridLineH, { top: `${(i / rows) * 100}%` }]} />
      ))}
      <LinearGradient
        colors={[EllaColors.canvas, 'rgba(255,255,255,0)', 'rgba(255,255,255,0)', EllaColors.canvas]}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[EllaColors.canvas, 'rgba(255,255,255,0)', 'rgba(255,255,255,0)', EllaColors.canvas]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HEADER_GRADIENT[0],
  },
  header: {
    paddingHorizontal: EllaSpacing.lg,
    paddingBottom: 48,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // EllaLogo has 8px built-in padding; pull it back to the screen edge.
  logo: {
    marginLeft: -EllaSpacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: EllaSpacing.md,
  },
  bell: {
    width: 26,
    height: 26,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EllaColors.button,
  },
  avatarIcon: {
    width: 22,
    height: 22,
  },
  pressed: {
    opacity: 0.7,
  },
  // design.md `caption` (12 / 16) in `Content-muted`.
  date: {
    marginTop: EllaSpacing.xl,
    fontFamily: EllaFonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
    color: EllaColors.contentMuted,
  },
  title: {
    marginTop: EllaSpacing.xs,
    fontFamily: EllaFonts.interBold,
    fontSize: 24,
    lineHeight: 32,
    color: EllaColors.button,
  },
  sheetBackground: {
    borderTopLeftRadius: EllaRadius.xl,
    borderTopRightRadius: EllaRadius.xl,
    backgroundColor: EllaColors.canvas,
  },
  sheetShadow: {
    shadowColor: EllaColors.contentInk,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: EllaSpacing.xs,
    paddingBottom: EllaSpacing.xxs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: SHEET_HANDLE,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: EllaSpacing.lg,
    paddingTop: EllaSpacing.md,
    paddingBottom: EllaSpacing.xs,
    backgroundColor: EllaColors.canvas,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: EllaSpacing.xxs,
    paddingVertical: 6,
    paddingHorizontal: EllaSpacing.sm,
    borderWidth: 1,
    borderColor: EllaColors.surfaceStrong,
    borderRadius: EllaRadius.full,
    backgroundColor: SEARCH_FILL,
  },
  searchIcon: {
    width: 18,
    height: 18,
  },
  searchLabel: {
    fontFamily: EllaFonts.interMedium,
    fontSize: 13,
    letterSpacing: 0.6,
    color: EllaColors.contentBody,
  },
  list: {
    paddingHorizontal: EllaSpacing.lg,
  },
  // design.md `caption` (12 / 16), muted, as a small group label.
  sectionHeader: {
    paddingTop: EllaSpacing.md,
    paddingBottom: EllaSpacing.xxs,
    fontFamily: EllaFonts.interMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: EllaColors.contentMuted,
    textTransform: 'uppercase',
  },
  listEmpty: {
    paddingTop: EllaSpacing.section,
    fontFamily: EllaFonts.interRegular,
    fontSize: 14,
    color: EllaColors.contentMuted,
    textAlign: 'center',
  },
  empty: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: EllaSpacing.xxl,
    paddingTop: 56,
  },
  syncing: {
    alignItems: 'center',
    gap: EllaSpacing.md,
    paddingTop: EllaSpacing.xl,
  },
  illustration: {
    width: 260,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: GRID_LINE,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: GRID_LINE,
  },
  folder: {
    width: 54,
    height: 54,
  },
  emptyText: {
    marginTop: EllaSpacing.xxs,
    maxWidth: 280,
    fontFamily: EllaFonts.interRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.6,
    color: AuthColors.secondary,
    textAlign: 'center',
  },
  syncButton: {
    width: 210,
    marginTop: EllaSpacing.xl,
  },
});
