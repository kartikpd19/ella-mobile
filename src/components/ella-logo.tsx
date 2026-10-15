import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { EllaColors } from '@/constants/ella-tokens';

const BAR_WIDTH = 2.277;
const BAR_LENGTH = 21.064;
const FADE_BAR_LENGTH = 26.497;

/** Ella mark + wordmark, built from Figma node 125:7091. */
export function EllaLogo() {
  return (
    <View style={styles.row} accessibilityRole="image" accessibilityLabel="Ella">
      <View style={styles.mark}>
        <Image source={require('@/assets/images/login/logo-ring.svg')} style={styles.ring} />
        <View style={styles.vertical} />
        <View style={styles.horizontal} />
        <View style={styles.diagonal} />
        <LinearGradient
          colors={['rgba(31,84,225,0)', EllaColors.ellaBlue]}
          locations={[0, 0.728]}
          style={styles.fadeDiagonal}
        />
      </View>
      <Image source={require('@/assets/images/login/ella-wordmark.svg')} style={styles.wordmark} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5.667,
    padding: 8,
  },
  mark: {
    width: 40.8,
    height: 40.8,
  },
  ring: {
    position: 'absolute',
    left: 6.1,
    top: 6.3,
    width: 34.527,
    height: 34.515,
  },
  vertical: {
    position: 'absolute',
    left: 22.43,
    top: 13.32,
    width: BAR_WIDTH,
    height: BAR_LENGTH,
    backgroundColor: EllaColors.ellaBlue,
  },
  horizontal: {
    position: 'absolute',
    left: 13.03,
    top: 22.43,
    width: BAR_LENGTH,
    height: BAR_WIDTH,
    backgroundColor: EllaColors.ellaBlue,
  },
  // Centered at (23.56, 23.56), running top-right to bottom-left.
  diagonal: {
    position: 'absolute',
    left: 23.5625 - BAR_WIDTH / 2,
    top: 23.5625 - BAR_LENGTH / 2,
    width: BAR_WIDTH,
    height: BAR_LENGTH,
    backgroundColor: EllaColors.ellaBlue,
    transform: [{ rotate: '45deg' }],
  },
  // Centered at (21.64, 21.64), fading out toward the top-left.
  fadeDiagonal: {
    position: 'absolute',
    left: 21.6435 - BAR_WIDTH / 2,
    top: 21.6435 - FADE_BAR_LENGTH / 2,
    width: BAR_WIDTH,
    height: FADE_BAR_LENGTH,
    transform: [{ rotate: '-45deg' }],
  },
  wordmark: {
    width: 62.531,
    height: 31.167,
  },
});
