import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { QuestIcon } from '@/components/QuestIcon';
import { useToast } from '@/components/ToastProvider';
import { STARTER_QUESTS } from '@/data/starterQuests';
import { useOnboardingStore } from '@/store/onboardingStore';
import { border, colors, fonts, fontSize, spacing } from '@/theme';

export default function FirstQuestScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();

  const selected = useOnboardingStore((state) => state.selectedQuests);
  const toggleQuest = useOnboardingStore((state) => state.toggleQuest);

  const next = (): void => {
    if (selected.length === 0) {
      toast.show(t('onboarding.firstQuest.needOne'), 'danger');
      return;
    }
    router.push('/(onboarding)/penalty');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('onboarding.firstQuest.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.firstQuest.subtitle')}</Text>

      <View style={styles.list}>
        {STARTER_QUESTS.map((quest) => {
          const isSelected = selected.includes(quest.key);
          const title = t(`onboarding.firstQuest.suggestions.${quest.key}`);

          return (
            <Pressable
              key={quest.key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={title}
              onPress={() => toggleQuest(quest.key)}
            >
              <PixelPanel style={[styles.card, isSelected && styles.cardSelected]}>
                <QuestIcon icon={quest.icon} scale={2} />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{title}</Text>
                  <Text style={styles.cardMeta}>
                    {t(`difficulty.${quest.difficulty}`)} · {t(`stat.${quest.stat}`)}
                  </Text>
                </View>
                <Text style={[styles.check, isSelected && styles.checkOn]}>
                  {isSelected ? '✓' : ''}
                </Text>
              </PixelPanel>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.note}>{t('onboarding.firstQuest.graceNote')}</Text>

      <PixelButton label={t('onboarding.firstQuest.cta')} onPress={next} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.displaySm,
    color: colors.gold,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.bodySm,
    color: colors.textDim,
    textAlign: 'center',
  },
  list: { gap: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardSelected: { borderColor: colors.gold, borderWidth: border.widthThick },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.ink },
  cardMeta: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.inkSoft },
  check: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.title,
    color: colors.transparent,
    width: spacing.xl,
    textAlign: 'center',
  },
  checkOn: { color: colors.xpDark },
  note: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textDim,
    textAlign: 'center',
  },
});
