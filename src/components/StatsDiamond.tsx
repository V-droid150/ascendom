import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import { STAT_KEYS } from '@/engine/constants';
import { fonts, fontSize, makeStyles, spacing, useColors } from '@/theme';
import type { StatKey } from '@/types';

interface StatsDiamondProps {
  stats: Record<StatKey, number>;
  size?: number;
}

/** Axis order is fixed so the shape of a hero's chart stays comparable. */
const AXES: { key: StatKey; angle: number }[] = [
  { key: 'strength', angle: -90 },
  { key: 'intelligence', angle: 0 },
  { key: 'wisdom', angle: 90 },
  { key: 'charisma', angle: 180 },
];

/**
 * A four-axis diamond chart of the hero's stats.
 *
 * Scaled against the hero's own best stat rather than a fixed ceiling, because
 * stats grow without bound — a fixed maximum would flatten to a dot for a new
 * hero and peg at full for a veteran. A numeric list sits beside it so the data
 * is readable without interpreting the shape.
 */
export function StatsDiamond({ stats, size = 160 }: StatsDiamondProps) {
  const colors = useColors();
  const styles = useStyles();
  const { t } = useTranslation();

  const center = size / 2;
  const radius = center - 12;
  const peak = Math.max(1, ...STAT_KEYS.map((key) => stats[key]));

  const pointFor = (value: number, angle: number): [number, number] => {
    const ratio = Math.min(1, value / peak);
    const radians = (angle * Math.PI) / 180;
    return [
      center + Math.cos(radians) * radius * ratio,
      center + Math.sin(radians) * radius * ratio,
    ];
  };

  const polygon = AXES.map(({ key, angle }) => pointFor(stats[key], angle).join(',')).join(' ');
  const outline = AXES.map(({ angle }) => pointFor(peak, angle).join(',')).join(' ');

  return (
    <View style={styles.row}>
      <Svg width={size} height={size} accessibilityLabel={t('hero.stats')}>
        <Polygon
          points={outline}
          fill={colors.nightDeep}
          stroke={colors.charcoal}
          strokeWidth={2}
        />
        {AXES.map(({ angle }) => {
          const [x, y] = pointFor(peak, angle);
          return (
            <Line
              key={angle}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={colors.charcoal}
              strokeWidth={1}
            />
          );
        })}
        <Polygon
          points={polygon}
          fill={colors.mana}
          fillOpacity={0.55}
          stroke={colors.mana}
          strokeWidth={2}
        />
        {AXES.map(({ key, angle }) => {
          const [x, y] = pointFor(stats[key], angle);
          return <Circle key={key} cx={x} cy={y} r={2.5} fill={colors.gold} />;
        })}
      </Svg>

      <View style={styles.legend}>
        {STAT_KEYS.map((key) => (
          <View key={key} style={styles.legendRow}>
            <Text style={styles.legendLabel}>{t(`stat.${key}`)}</Text>
            <Text style={styles.legendValue}>{stats[key]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  legend: { flex: 1, gap: spacing.xs },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  legendLabel: { fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.text },
  legendValue: { fontFamily: fonts.display, fontSize: fontSize.displayXs, color: colors.gold },
}));
