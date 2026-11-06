import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { cosmeticInSlot, ownedBySlot, withCosmeticInSlot, type CosmeticSlot } from '@/engine/shop';
import { border, fonts, fontSize, makeStyles, MIN_TOUCH_SIZE, spacing } from '@/theme';
import type { Hero } from '@/types';
import { PixelButton } from './PixelButton';
import { ShopItemIcon } from './ShopItemIcon';

const SLOTS: readonly CosmeticSlot[] = ['cape', 'tint'];

interface FineryPickerProps {
  hero: Hero;
  /** The draft loadout: cosmetic ids being worn. */
  loadout: readonly string[];
  onChange: (loadout: string[]) => void;
  /** Shown when nothing has been bought yet. */
  onOpenShop: () => void;
}

/**
 * Everything the hero has bought from the shop, one row per slot, so finery
 * can be put on and taken off alongside the rest of the look. "None" empties
 * a slot; picking an item replaces whatever the slot held.
 */
export function FineryPicker({ hero, loadout, onChange, onOpenShop }: FineryPickerProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const owned = ownedBySlot(hero);

  if (owned.cape.length === 0 && owned.tint.length === 0) {
    return (
      <View style={styles.group}>
        <Text style={styles.label}>{t('wardrobe.finery')}</Text>
        <Text style={styles.empty}>{t('wardrobe.noFinery')}</Text>
        <PixelButton label={t('wardrobe.toShop')} variant="secondary" onPress={onOpenShop} />
      </View>
    );
  }

  return (
    <>
      {SLOTS.filter((slot) => owned[slot].length > 0).map((slot) => {
        const worn = cosmeticInSlot(loadout, slot);
        const options = [null, ...owned[slot].map((def) => def.id)];
        return (
          <View key={slot} style={styles.group}>
            <Text style={styles.label}>{t(`wardrobe.slot.${slot}`)}</Text>
            <View style={styles.row}>
              {options.map((id) => {
                const selected = id === worn;
                const name = id === null ? t('wardrobe.none') : t(`shop.items.${id}.name`);
                return (
                  <Pressable
                    key={id ?? 'none'}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={name}
                    onPress={() => onChange(withCosmeticInSlot(loadout, slot, id))}
                    style={[styles.option, selected && styles.selected]}
                  >
                    {id === null ? (
                      <Text style={styles.none}>{t('wardrobe.none')}</Text>
                    ) : (
                      <ShopItemIcon id={id} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </>
  );
}

const useStyles = makeStyles((colors) => ({
  group: { gap: spacing.xs },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSize.bodySm, color: colors.ink },
  empty: { fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.inkSoft },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    borderWidth: border.width,
    borderColor: colors.parchmentShadow,
    borderRadius: border.radius,
    backgroundColor: colors.parchmentDark,
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { borderColor: colors.gold, borderWidth: border.widthThick },
  none: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.bodySm,
    color: colors.ink,
    paddingHorizontal: spacing.sm,
  },
}));
