import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PixelButton } from '@/components/PixelButton';
import { supabase } from '@/services/supabase';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';

/**
 * Where the emailed login link lands. Exchanges the one-time code for a
 * session, then continues to Settings, where sync status is shown.
 *
 * The exchange only works in the browser that asked for the code (PKCE keeps
 * the verifier there), so opening the link elsewhere fails with a clear
 * message rather than silently doing nothing.
 */
export default function AuthCallback() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [exchangeFailed, setExchangeFailed] = useState(false);
  // A link without a code can never succeed, so that is a failure up front.
  const failed = exchangeFailed || !code;

  useEffect(() => {
    if (!code) return;
    void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) setExchangeFailed(true);
      else router.replace('/(tabs)/settings');
    });
  }, [code, router]);

  return (
    <View style={styles.screen}>
      <Text style={styles.text}>
        {failed ? t('account.callback.failed') : t('account.callback.signingIn')}
      </Text>
      {failed && (
        <PixelButton
          label={t('account.callback.back')}
          onPress={() => router.replace('/(tabs)/settings')}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.night,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.text,
    textAlign: 'center',
  },
}));
