import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { duration } from '@/theme';

interface RisingParticlesProps {
  color: string;
  count?: number;
}

const PARTICLE_SIZE = 4;
const TRAVEL = 220;

/**
 * Pixel motes drifting upward behind a celebration.
 *
 * "Ascend" is the whole brand idea, so every good thing that happens in the app
 * moves up the screen. Motion is stepped rather than eased for the same reason
 * the rest of the UI is: smooth easing reads as modern-app, not pixel-game.
 */
export function RisingParticles({ color, count = 14 }: RisingParticlesProps) {
  return (
    <View style={styles.host} pointerEvents="none">
      {Array.from({ length: count }, (_, index) => (
        <Particle key={index} color={color} index={index} count={count} />
      ))}
    </View>
  );
}

function Particle({ color, index, count }: { color: string; index: number; count: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 120,
      withRepeat(
        withTiming(1, {
          duration: duration.celebration,
          // Six steps instead of a continuous ramp keeps the motion chunky.
          easing: Easing.steps(6, true),
        }),
        -1,
        false,
      ),
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.85 ? 1 : 0,
    transform: [{ translateY: -progress.value * TRAVEL }],
  }));

  // Spread the motes evenly rather than randomly so they can't clump.
  const left = `${Math.round(((index + 0.5) / count) * 100)}%` as const;

  return (
    <Animated.View
      style={[styles.particle, { backgroundColor: color, left }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  particle: {
    position: 'absolute',
    bottom: '25%',
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
  },
});
