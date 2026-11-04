import { Modal, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/gameStore';
import { useSyncStore } from '@/store/syncStore';
import type { Hero } from '@/types';
import { resolveConflict } from '@/sync/controller';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';
import { PixelButton } from './PixelButton';
import { PixelPanel } from './PixelPanel';

/**
 * Asks which save to keep when this device and the cloud disagree.
 *
 * There is deliberately no dismiss: closing it by accident must not choose for
 * the player, since either answer replaces the other side's progress.
 */
export function SyncConflictModal() {
  const styles = useStyles();
  const { t } = useTranslation();
  const conflict = useSyncStore((state) => state.conflict);
  const localHero = useGameStore((state) => state.hero);

  if (!conflict) return null;

  const summary = (hero: Hero | null | undefined): string =>
    hero
      ? t('account.conflict.summary', { name: hero.name, level: hero.level })
      : t('account.conflict.noHero');

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <PixelPanel tone="dark" frameStyle={styles.frame} style={styles.panel}>
          <Text style={styles.title}>{t('account.conflict.title')}</Text>
          <Text style={styles.body}>{t('account.conflict.body')}</Text>
          <Text style={styles.option}>
            {t('account.conflict.cloud', { summary: summary(conflict.cloud.game.hero) })}
          </Text>
          <Text style={styles.option}>
            {t('account.conflict.device', { summary: summary(localHero) })}
          </Text>
          <PixelButton
            label={t('account.conflict.useCloud')}
            onPress={() => void resolveConflict('cloud')}
          />
          <PixelButton
            label={t('account.conflict.keepDevice')}
            variant="secondary"
            onPress={() => void resolveConflict('device')}
          />
        </PixelPanel>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  frame: { width: '100%', maxWidth: 400 },
  panel: { gap: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: fontSize.displaySm, color: colors.gold },
  body: { fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.text },
  option: { fontFamily: fonts.bodyBold, fontSize: fontSize.bodySm, color: colors.textDim },
}));
