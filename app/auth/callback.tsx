import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PixelButton } from '@/components/PixelButton';
import { takeAuthReturn } from '@/services/auth';
import { supabase } from '@/services/supabase';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';

/**
 * Where Google sign-in returns. Exchanges the one-time code for a session,
 * then goes back to wherever sign-in started (title screen or Settings).
 *
 * The exchange only works in the browser that started sign-in (PKCE keeps the
 * verifier there), and a cancelled Google prompt comes back with no code, so
 * both end on a clear message rather than silently doing nothing.
 *
 * A code can be exchanged once. The effect is guarded so a re-render can't
 * try it twice, and a failed exchange still counts as success if a session
 * exists anyway (for example, the first attempt already stored it).
 */
export default function AuthCallback() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const { code, error_description: providerError } = useLocalSearchParams<{
    code?: string;
    error_description?: string;
  }>();
  const [exchangeFailed, setExchangeFailed] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const started = useRef(false);
  // A link without a code can never succeed, so that is a failure up front.
  const failed = exchangeFailed || !code;

  useEffect(() => {
    if (!code || started.current) return;
    started.current = true;
    void (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      const { data } = await supabase.auth.getSession();
      if (error && !data.session) {
        setDetail(error.message);
        setExchangeFailed(true);
        return;
      }
      const next = await takeAuthReturn();
      router.replace(next === 'settings' ? '/(tabs)/settings' : '/(onboarding)/welcome');
    })();
  }, [code, router]);

  return (
    <View style={styles.screen}>
      <Text style={styles.text}>
        {failed ? t('auth.callback.failed') : t('auth.callback.signingIn')}
      </Text>
      {failed && (providerError ?? detail) && (
        <Text style={styles.detail}>{providerError ?? detail}</Text>
      )}
      {failed && (
        <PixelButton
          label={t('auth.callback.back')}
          onPress={() => router.replace('/(onboarding)/welcome')}
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
  detail: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textDim,
    textAlign: 'center',
  },
}));
