import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '@/theme';

/** Placeholder route. Replaced by the real entry point in Phase 3. */
export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ASCENDOM</Text>
      <Text style={styles.subtitle}>Engine online.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.night,
    gap: spacing.md,
  },
  title: {
    color: colors.gold,
    fontSize: fontSize.display,
    letterSpacing: 2,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: fontSize.body,
  },
});
