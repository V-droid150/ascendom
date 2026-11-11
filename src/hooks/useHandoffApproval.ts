import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ToastProvider';
import { PASSWORD_MIN_LENGTH, signInWithGoogle } from '@/services/auth';
import {
  approveHandoff,
  clearHandoffBrowser,
  handoffBrowserParams,
  markHandoffBrowser,
  noteFreshHandoffSignIn,
  parseHandoffParams,
  takeFreshHandoffSignIn,
} from '@/services/googleHandoff';
import { supabase } from '@/services/supabase';
import { useSyncStore } from '@/store/syncStore';

export type ApprovalPhase = 'invalid' | 'signedOut' | 'confirm' | 'code';

/**
 * Safari's side of the home-screen app's Google sign-in: sign in, approve,
 * show the code. The handoff id and hash come from the link, or from this
 * tab's session storage after the trip to Google and back.
 */
export function useHandoffApproval(id: string | undefined, secretHash: string | undefined) {
  const { t } = useTranslation();
  const toast = useToast();
  const userId = useSyncStore((state) => state.userId);
  const email = useSyncStore((state) => state.email);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const params = useMemo(
    () => parseHandoffParams(id, secretHash) ?? handoffBrowserParams(),
    [id, secretHash],
  );

  useEffect(() => {
    if (params) markHandoffBrowser(params);
  }, [params]);

  const phase: ApprovalPhase = !params
    ? 'invalid'
    : code
      ? 'code'
      : userId
        ? 'confirm'
        : 'signedOut';

  const signIn = async (): Promise<void> => {
    noteFreshHandoffSignIn();
    const result = await signInWithGoogle('handoff');
    if (!result.ok)
      toast.show(t(`auth.errors.${result.error}`, { count: PASSWORD_MIN_LENGTH }), 'danger');
  };

  const switchAccount = async (): Promise<void> => {
    await supabase.auth.signOut({ scope: 'local' });
    await signIn();
  };

  const approve = async (): Promise<void> => {
    if (!params) return;
    setBusy(true);
    const result = await approveHandoff(params);
    setBusy(false);
    if (!result.ok) {
      toast.show(t(`auth.errors.${result.error}`, { count: PASSWORD_MIN_LENGTH }), 'danger');
      return;
    }
    setCode(result.code);
    clearHandoffBrowser();
    // A tab that signed in just for this leaves no session behind in Safari.
    if (takeFreshHandoffSignIn()) await supabase.auth.signOut({ scope: 'local' });
  };

  return { phase, email, code, busy, signIn, switchAccount, approve };
}
