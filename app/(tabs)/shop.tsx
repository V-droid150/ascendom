import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COSMETICS, MAX_SHIELDS, POTION_COST, POTION_HEAL, SHIELD_COST } from '@/engine/constants';
import { HeroStatusBar } from '@/components/HeroStatusBar';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { useWideContentStyle } from '@/components/ResponsiveColumns';
import { ShopItemIcon } from '@/components/ShopItemIcon';
import { useToast } from '@/components/ToastProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useLayout } from '@/hooks/useLayout';
import { useSound } from '@/hooks/useSound';
import { useGameStore } from '@/store/gameStore';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';
import type { PurchaseResult } from '@/engine';

export default function ShopScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const toast = useToast();
  const haptics = useHaptics();
  const playSound = useSound();
  const layout = useLayout();
  const wideContent = useWideContentStyle();
  // Wide windows lay the wares out as a grid: two across on a tablet, three on desktop.
  // PixelPanel puts `style` on its inner surface, so the grid cell sizing goes on its frame.
  const itemStyle = [styles.item, layout.isWide && styles.gridItemSurface];
  const cellStyle = [
    layout.isWide && styles.gridItem,
    layout.size === 'desktop' && styles.gridItemDesktop,
  ];
  const gridStyle = layout.isWide ? styles.grid : styles.list;

  const hero = useGameStore((state) => state.hero);
  const buyShield = useGameStore((state) => state.buyShield);
  const buyPotion = useGameStore((state) => state.buyPotion);
  const buyCosmetic = useGameStore((state) => state.buyCosmetic);
  const equipCosmetic = useGameStore((state) => state.equipCosmetic);
  const unequipCosmetic = useGameStore((state) => state.unequipCosmetic);
  const todayKey = useGameStore((state) => state.todayKey);

  if (!hero) return null;

  const handle = (result: PurchaseResult): void => {
    if (result.ok) {
      haptics.success();
      playSound('coin');
      toast.show(t('toast.purchased', { gold: result.spent }), 'success');
    } else {
      haptics.error();
      toast.show(t(`shop.errors.${result.reason}`), 'danger');
    }
  };

  const potionUsedToday = hero.lastPotionDayKey === todayKey();

  return (
    <View style={styles.screen}>
      <HeroStatusBar />

      <ScrollView contentContainerStyle={[styles.content, wideContent]}>
        <Text style={styles.sectionTitle}>{t('shop.sectionConsumables')}</Text>
        <View style={gridStyle}>
          <PixelPanel style={itemStyle} frameStyle={cellStyle}>
            <ShopItemIcon id="shield" />
            <View style={styles.itemText}>
              <Text style={styles.itemName}>{t('shop.items.shield.name')}</Text>
              <Text style={styles.itemDesc}>
                {t('shop.items.shield.description', { max: MAX_SHIELDS })}
              </Text>
              <Text style={styles.owned}>
                {t('shop.owned')}: {hero.shields} / {MAX_SHIELDS}
              </Text>
            </View>
            <View style={styles.buyColumn}>
              <Text style={styles.price}>{SHIELD_COST}◈</Text>
              <PixelButton
                label={t('shop.buy')}
                compact
                onPress={() => handle(buyShield())}
                disabled={hero.gold < SHIELD_COST || hero.shields >= MAX_SHIELDS}
              />
            </View>
          </PixelPanel>

          <PixelPanel style={itemStyle} frameStyle={cellStyle}>
            <ShopItemIcon id="potion" />
            <View style={styles.itemText}>
              <Text style={styles.itemName}>{t('shop.items.potion.name')}</Text>
              <Text style={styles.itemDesc}>
                {t('shop.items.potion.description', { heal: POTION_HEAL })}
              </Text>
            </View>
            <View style={styles.buyColumn}>
              <Text style={styles.price}>{POTION_COST}◈</Text>
              <PixelButton
                label={t('shop.buy')}
                compact
                onPress={() => handle(buyPotion())}
                disabled={hero.gold < POTION_COST || potionUsedToday}
              />
            </View>
          </PixelPanel>
        </View>

        <Text style={styles.sectionTitle}>{t('shop.sectionCosmetics')}</Text>
        <Text style={styles.note}>{t('shop.cosmeticNote')}</Text>
        <View style={gridStyle}>
          {COSMETICS.map((cosmetic) => {
            const owned = hero.ownedCosmetics.includes(cosmetic.id);
            const equipped = hero.equippedCosmetics.includes(cosmetic.id);

            return (
              <PixelPanel key={cosmetic.id} style={itemStyle} frameStyle={cellStyle}>
                <ShopItemIcon id={cosmetic.id} />

                <View style={styles.itemText}>
                  <Text style={styles.itemName}>{t(`shop.items.${cosmetic.id}.name`)}</Text>
                  {owned && <Text style={styles.owned}>{t('shop.inWardrobe')}</Text>}
                </View>

                <View style={styles.buyColumn}>
                  {!owned && <Text style={styles.price}>{cosmetic.cost}◈</Text>}
                  {owned ? (
                    <PixelButton
                      label={equipped ? t('shop.unequip') : t('shop.equip')}
                      variant={equipped ? 'ghost' : 'secondary'}
                      compact
                      onPress={() =>
                        equipped ? unequipCosmetic(cosmetic.id) : equipCosmetic(cosmetic.id)
                      }
                    />
                  ) : (
                    <PixelButton
                      label={t('shop.buy')}
                      compact
                      onPress={() => handle(buyCosmetic(cosmetic.id))}
                      disabled={hero.gold < cosmetic.cost}
                    />
                  )}
                </View>
              </PixelPanel>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.night },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxxl },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize.displayXs,
    color: colors.textDim,
    marginTop: spacing.sm,
  },
  note: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  list: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridItem: { flexGrow: 1, flexBasis: '45%' },
  // Fills the cell, so cards in one row share a height.
  gridItemSurface: { flexGrow: 1 },
  gridItemDesktop: { flexBasis: '30%' },
  itemText: { flex: 1, gap: 2 },
  itemName: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.ink },
  itemDesc: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.inkSoft },
  owned: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.xpDark },
  buyColumn: { alignItems: 'center', gap: spacing.xs },
  price: { fontFamily: fonts.display, fontSize: fontSize.displayXs, color: colors.ink },
}));
