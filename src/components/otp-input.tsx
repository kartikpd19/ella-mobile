import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { EllaColors, EllaFonts, EllaRadius } from '@/constants/ella-tokens';

const CELL_BORDER = '#CEC1E1'; // OTP cell border from design.md

type OtpInputProps = {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Cell size; defaults to the design.md OTP component (54×69). */
  cellWidth?: number;
  cellHeight?: number;
};

const GAP = 5;

/**
 * Row of single-digit boxes. A single transparent TextInput sits on top and holds
 * the whole code, so typing advances box by box, backspace steps back, and pasting
 * or OS one-time-code autofill fills every box at once.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  error = false,
  disabled = false,
  autoFocus = false,
  cellWidth = 54,
  cellHeight = 69,
}: OtpInputProps) {
  const [focused, setFocused] = useState(false);
  const activeIndex = focused && !disabled ? Math.min(value.length, length - 1) : -1;
  const rowWidth = cellWidth * length + GAP * (length - 1);

  return (
    <View style={[styles.row, { width: rowWidth }]}>
      {Array.from({ length }, (_, index) => {
        const digit = value[index] ?? '';
        const active = index === activeIndex;
        return (
          <View
            key={index}
            style={[
              styles.cell,
              { maxWidth: cellWidth, aspectRatio: cellWidth / cellHeight },
              active && styles.cellActive,
              error && styles.cellError,
            ]}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden>
            {digit ? (
              <Text style={styles.digit}>{digit}</Text>
            ) : (
              active && <View style={styles.caret} />
            )}
          </View>
        );
      })}

      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        caretHidden
        accessibilityLabel={`Verification code, ${length} digits`}
        style={styles.hiddenInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: GAP,
    maxWidth: '100%',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CELL_BORDER,
    borderRadius: EllaRadius.md,
    backgroundColor: EllaColors.canvas,
  },
  cellActive: {
    borderColor: EllaColors.ellaBlue,
  },
  cellError: {
    borderColor: EllaColors.semanticError,
  },
  digit: {
    fontFamily: EllaFonts.monoMedium,
    fontSize: 35.048,
    color: EllaColors.contentInk,
    textAlign: 'center',
  },
  caret: {
    width: 2,
    height: 32,
    borderRadius: 1,
    backgroundColor: EllaColors.ellaBlue,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0,
  },
});
