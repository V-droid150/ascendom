import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { addDaysToKey } from '@/engine/dayKey';
import { border, fonts, fontSize, makeStyles, spacing, useColors, type ThemeColors } from '@/theme';
import type { DayResult } from '@/types';

interface ChronicleHeatmapProps {
  dayResults: DayResult[];
  todayKey: string;
  days?: number;
}

/**
 * The Royal Chronicle: the last 30 days as a pixel calendar.
 *
 * Each cell encodes what kind of day it was, not just how productive: a fall is
 * marked distinctly from a plain miss, and protected days (grace, rest, shield)
 * read as neutral rather than as failures — otherwise taking a legitimate rest
 * day would look like a gap in the record.
 */
export function ChronicleHeatmap({ dayResults, todayKey, days = 30 }: ChronicleHeatmapProps) {
  const colors = useColors();
  const styles = useStyles();
  const { t } = useTranslation();

  const byKey = new Map(dayResults.map((result) => [result.dayKey, result]));
  const keys = Array.from({ length: days }, (_, i) => addDaysToKey(todayKey, -(days - 1 - i)));

  return (
    <View style={styles.block}>
      <View style={styles.grid}>
        {keys.map((key) => {
          const result = byKey.get(key);
          return (
            <View
              key={key}
              accessible
              accessibilityLabel={t('a11y.chronicleDay', {
                date: key,
                completed: result?.completed ?? 0,
                missed: result?.missed ?? 0,
              })}
              style={[styles.cell, cellStyle(result, colors)]}
            >
              {result?.fell && <Text style={styles.fellMark}>×</Text>}
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <LegendSwatch color={colors.xp} label={t('quests.completedSection')} />
        <LegendSwatch color={colors.hp} label={t('hero.fallCount')} />
        <LegendSwatch color={colors.mana} label={t('settings.restDay')} />
      </View>
    </View>
  );
}

function cellStyle(
  result: DayResult | undefined,
  colors: ThemeColors,
): { backgroundColor: string; borderColor: string } {
  if (!result) return { backgroundColor: colors.nightDeep, borderColor: colors.charcoal };
  if (result.fell) return { backgroundColor: colors.hpDark, borderColor: colors.hp };
  if (result.restDay || result.graceDay || result.shieldUsed) {
    return { backgroundColor: colors.charcoal, borderColor: colors.mana };
  }
  if (result.missed > 0) return { backgroundColor: colors.hpDark, borderColor: colors.hpDark };
  if (result.completed > 0) return { backgroundColor: colors.xp, borderColor: colors.xpDark };
  return { backgroundColor: colors.nightDeep, borderColor: colors.charcoal };
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  block: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  cell: {
    width: 18,
    height: 18,
    borderWidth: border.width,
    borderRadius: border.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fellMark: { fontFamily: fonts.bodyBold, fontSize: fontSize.caption, color: colors.text },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendSwatch: { width: 10, height: 10 },
  legendText: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
}));
