import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { EllaColors, EllaFonts, EllaSpacing } from '@/constants/ella-tokens';

type UnderlineTabsProps<T extends string> = {
  tabs: readonly T[];
  selected: T;
  onSelect: (tab: T) => void;
  style?: StyleProp<ViewStyle>;
};

/** Text tabs with an `Ella Blue` underline under the selected one (Home, Visit Detail). */
export function UnderlineTabs<T extends string>({ tabs, selected, onSelect, style }: UnderlineTabsProps<T>) {
  return (
    <View style={[styles.tabs, style]} accessibilityRole="tablist">
      {tabs.map((name) => {
        const isSelected = name === selected;
        return (
          <Pressable
            key={name}
            onPress={() => onSelect(name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            style={styles.tab}>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{name}</Text>
            <View style={[styles.indicator, isSelected && styles.indicatorSelected]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: EllaSpacing.md,
  },
  tab: {
    alignItems: 'stretch',
    gap: EllaSpacing.xs,
  },
  label: {
    paddingHorizontal: EllaSpacing.xxs,
    fontFamily: EllaFonts.interMedium,
    fontSize: 16,
    lineHeight: 20,
    color: EllaColors.contentSoft,
  },
  labelSelected: {
    fontFamily: EllaFonts.interBold,
    color: EllaColors.contentInk,
  },
  indicator: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  indicatorSelected: {
    backgroundColor: EllaColors.ellaBlue,
  },
});
