import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ToastProvider';
import {
  normalizeCode,
  redeemHandoff,
  resetHandoff,
  safariUrl,
  startHandoff,
  type HandoffErrorKey,
  type HandoffReturn,
} from '@/services/googleHandoff';
import { PASSWORD_MIN_LENGTH } from '@/services/auth';

/**
 * The home-screen app's side of Google sign-in through Safari: prepares the
 * link, opens it, and trades the code the player brings back for a session.
 */
export function useGoogleHandoff(returnTo: HandoffReturn) {
  const { t } = useTranslation();
  const toast = useToast();
  const [url, setUrl] = useState<string | null>(null);
  const [code, setCodeRaw] = useState('');
  const [busy, setBusy] = useState(false);

  const prepare = async (): Promise<void> => {
    const started = await startHandoff(returnTo, Date.now());
    setUrl(started?.url ?? null);
  };

  // Once per visit. Reuses a link made in the last ten minutes, so coming
  // back from Safari (or iOS reloading the app) keeps the one already opened.
  useEffect(() => {
    let alive = true;
    void startHandoff(returnTo, Date.now()).then((started) => {
      if (alive) setUrl(started?.url ?? null);
    });
    return () => {
      alive = false;
    };
  }, [returnTo]);

  const showError = (error: HandoffErrorKey): void => {
    toast.show(t(`auth.errors.${error}`, { count: PASSWORD_MIN_LENGTH }), 'danger');
  };

  const openSafari = async (): Promise<void> => {
    if (!url) return;
    try {
      await Linking.openURL(safariUrl(url));
    } catch {
      // Older iOS without x-safari-https: the copy-link button still works.
      toast.show(t('auth.handoff.openFailed'), 'danger');
    }
  };

  const copyLink = async (): Promise<void> => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.show(t('auth.handoff.copied'), 'success');
    } catch {
      toast.show(t('auth.handoff.copyFailed', { url }), 'danger');
    }
  };

  const restart = async (): Promise<void> => {
    await resetHandoff();
    setCodeRaw('');
    await prepare();
    toast.show(t('auth.handoff.restarted'));
  };

  /** True once signed in. */
  const submit = async (): Promise<boolean> => {
    setBusy(true);
    const result = await redeemHandoff(code, Date.now());
    setBusy(false);
    if (!result.ok) {
      showError(result.error);
      // A dead handoff needs a new link before anything else can work.
      if (result.error === 'handoff_expired' || result.error === 'handoff_locked') {
        setCodeRaw('');
        await prepare();
      }
      return false;
    }
    toast.show(t('auth.signedIn'), 'success');
    return true;
  };

  return {
    ready: url !== null,
    code,
    setCode: (value: string) => setCodeRaw(normalizeCode(value)),
    canSubmit: !busy && code.length === 6,
    busy,
    openSafari,
    copyLink,
    restart,
    submit,
  };
}
