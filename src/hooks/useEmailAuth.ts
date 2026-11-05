import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ToastProvider';
import {
  EMAIL_PATTERN,
  PASSWORD_MIN_LENGTH,
  sendPasswordReset,
  signInWithPassword,
  signUpWithPassword,
  type AuthResult,
} from '@/services/auth';

export type EmailAuthMode = 'signIn' | 'signUp';

interface EmailAuth {
  mode: EmailAuthMode;
  setMode: (mode: EmailAuthMode) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  busy: boolean;
  canSubmit: boolean;
  /** Resolves true once the player is signed in. */
  submit: () => Promise<boolean>;
  forgotPassword: () => Promise<void>;
}

/** Form state and actions for the email + password screen. */
export function useEmailAuth(initialMode: EmailAuthMode): EmailAuth {
  const { t } = useTranslation();
  const toast = useToast();
  const [mode, setMode] = useState<EmailAuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const address = email.trim().toLowerCase();

  const fail = (result: AuthResult): void => {
    if (!result.ok)
      toast.show(t(`auth.errors.${result.error}`, { count: PASSWORD_MIN_LENGTH }), 'danger');
  };

  const submit = async (): Promise<boolean> => {
    if (!EMAIL_PATTERN.test(address)) {
      toast.show(t('auth.errors.invalidEmail'), 'danger');
      return false;
    }
    if (mode === 'signUp' && password.length < PASSWORD_MIN_LENGTH) {
      toast.show(t('auth.errors.weakPassword', { count: PASSWORD_MIN_LENGTH }), 'danger');
      return false;
    }

    setBusy(true);
    const result =
      mode === 'signIn'
        ? await signInWithPassword(address, password)
        : await signUpWithPassword(address, password);
    setBusy(false);

    if (!result.ok) {
      fail(result);
      return false;
    }
    if (result.needsConfirmation) {
      toast.show(t('auth.confirmEmail', { email: address }));
      return false;
    }
    toast.show(t(mode === 'signIn' ? 'auth.signedIn' : 'auth.accountCreated'), 'success');
    return true;
  };

  const forgotPassword = async (): Promise<void> => {
    if (!EMAIL_PATTERN.test(address)) {
      toast.show(t('auth.errors.resetNeedsEmail'), 'danger');
      return;
    }
    setBusy(true);
    const result = await sendPasswordReset(address);
    setBusy(false);
    if (result.ok) toast.show(t('auth.resetSent', { email: address }), 'success');
    else fail(result);
  };

  return {
    mode,
    setMode,
    email,
    setEmail,
    password,
    setPassword,
    busy,
    canSubmit: !busy && address.length > 0 && password.length > 0,
    submit,
    forgotPassword,
  };
}
