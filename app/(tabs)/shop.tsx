import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  COSMETICS,
  MAX_SHIELDS,
  POTION_COST,
  POTION_HEAL,
  SHIELD_COST,
} from '@/engine/constants';
import { HeroStatusBar } from '@/components/HeroStatusBar';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { useToast } from '@/components/ToastProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { MIN_CAPE_RANK } from '@/sprites';
import { RANKS } from '@/engine/ranks';
import { useGameStore } from '@/store/gameStore';
import { PALETTE } from '@/theme/colors';
import { border, colors, fonts, fontSize, spacing } from '@/theme';
import type { PurchaseResult } from '@/engine';

/** The rank at which capes start rendering, resolved to its i18n key. */
const CAPE_RANK_ID = RANKS.find((rank) => rank.rank === MIN_CAPE_RANK)?.id ?? 'captain';

export default function ShopScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const haptics = useHaptics();
  const playSound = useSound();

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

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>{t('shop.sectionConsumables')}</Text>

        <PixelPanel style={styles.item}>
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

        <PixelPanel style={styles.item}>
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

        <Text style={styles.sectionTitle}>{t('shop.sectionCosmetics')}</Text>
        <Text style={styles.note}>{t('shop.cosmeticNote')}</Text>

        {COSMETICS.map((cosmetic) => {
          const owned = hero.ownedCosmetics.includes(cosmetic.id);
          const equipped = hero.equippedCosmetics.includes(cosmetic.id);

          return (
            <PixelPanel key={cosmetic.id} style={styles.item}>
              <View
                style={[styles.swatch, { backgroundColor: PALETTE[cosmetic.color] }]}
                accessibilityElementsHidden
              />

              <View style={styles.itemText}>
                <Text style={styles.itemName}>{t(`shop.items.${cosmetic.id}.name`)}</Text>
                {/* Capes only render from rank 4, so say so before they buy. */}
                {cosmetic.slot === 'cape' && (
                  <Text style={styles.itemDesc}>
                    {t('shop.capeNote', { rank: t(`rank.${CAPE_RANK_ID}.${hero.gender}`) })}
                  </Text>
                )}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxxl },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize.displayXs,
    color: colors.textDim,
    marginTop: spacing.sm,
  },
  note: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemText: { flex: 1, gap: 2 },
  itemName: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.ink },
  itemDesc: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.inkSoft },
  owned: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.xpDark },
  buyColumn: { alignItems: 'center', gap: spacing.xs },
  price: { fontFamily: fonts.display, fontSize: fontSize.displayXs, color: colors.ink },
  swatch: {
    width: 28,
    height: 28,
    borderWidth: border.width,
    borderColor: colors.night,
  },
});
