import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HERO_NAME_MAX_LENGTH } from '@/engine/constants';
import { useGameStore } from '@/store/gameStore';
import { border, fonts, fontSize, makeStyles, MIN_TOUCH_SIZE, spacing, useColors } from '@/theme';
import { PixelButton } from './PixelButton';
import { useToast } from './ToastProvider';

/**
 * The hero's name, with a pencil to rename it in place.
 *
 * Renaming is purely cosmetic: the engine trims and length-limits the name and
 * refuses an empty one, and nothing about progress changes.
 */
export function HeroNameEditor({ name }: { name: string }) {
  const styles = useStyles();
  const colors = useColors();
  const { t } = useTranslation();
  const toast = useToast();
  const rename = useGameStore((state) => state.rename);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const startEditing = (): void => {
    setDraft(name);
    setEditing(true);
  };

  const save = (): void => {
    if (!rename(draft).ok) {
      toast.show(t('hero.renameEmpty'), 'danger');
      return;
    }
    setEditing(false);
    toast.show(t('hero.renamed'), 'success');
  };

  if (!editing) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('hero.renameA11y', { name })}
        onPress={startEditing}
        style={styles.display}
      >
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.pencil}>✎</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.editor}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={save}
        maxLength={HERO_NAME_MAX_LENGTH}
        autoFocus
        selectTextOnFocus
        returnKeyType="done"
        placeholder={t('hero.renamePlaceholder')}
        placeholderTextColor={colors.steel}
        accessibilityLabel={t('hero.renamePlaceholder')}
        style={styles.input}
      />
      <View style={styles.actions}>
        <PixelButton label={t('hero.renameSave')} compact onPress={save} />
        <PixelButton
          label={t('common.cancel')}
          variant="ghost"
          compact
          onPress={() => setEditing(false)}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  display: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.md,
  },
  name: { fontFamily: fonts.bodyBold, fontSize: fontSize.title, color: colors.text },
  pencil: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.gold },
  editor: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  input: {
    minWidth: 220,
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.title,
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.nightDeep,
    borderWidth: border.width,
    borderColor: colors.gold,
    borderRadius: border.radius,
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
}));
