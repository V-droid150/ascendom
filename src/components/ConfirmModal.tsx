import { Modal, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PixelButton } from './PixelButton';
import { PixelPanel } from './PixelPanel';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A blocking confirmation, used for anything that destroys data. */
export function ConfirmModal({
  visible,
  title,
  body,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <PixelPanel tone="dark" frameStyle={styles.frame} style={styles.panel}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>

          <View style={styles.actions}>
            <PixelButton
              label={t('common.cancel')}
              variant="ghost"
              onPress={onCancel}
              style={styles.action}
            />
            <PixelButton
              label={confirmLabel ?? t('common.confirm')}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              style={styles.action}
            />
          </View>
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
  panel: { gap: spacing.md },
  title: { fontFamily: fonts.display, fontSize: fontSize.displayXs, color: colors.gold },
  body: { fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
}));
