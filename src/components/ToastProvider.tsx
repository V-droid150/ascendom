import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { border, colors, duration, fonts, fontSize, spacing, zIndex } from '@/theme';

export type ToastTone = 'info' | 'success' | 'danger';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastApi>({ show: () => {} });

const VISIBLE_MS = 2600;

/**
 * Toasts are the app's only error channel, so this provider sits above every
 * screen. Nothing in the app is allowed to fail silently.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);

    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, VISIBLE_MS);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View style={styles.host} pointerEvents="none">
        {toasts.map((toast) => (
          <View key={toast.id} style={[styles.toast, TONE_STYLE[toast.tone]]}>
            <Text style={styles.message} accessibilityLiveRegion="polite">
              {toast.message}
            </Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

const TONE_STYLE: Record<ToastTone, { backgroundColor: string; borderColor: string }> = {
  info: { backgroundColor: colors.charcoal, borderColor: colors.mana },
  success: { backgroundColor: colors.charcoal, borderColor: colors.xp },
  danger: { backgroundColor: colors.charcoal, borderColor: colors.hp },
};

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xxxl,
    gap: spacing.sm,
    zIndex: zIndex.toast,
  },
  toast: {
    borderWidth: border.width,
    borderRadius: border.radius,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    // Hard offset shadow instead of a blur, to stay in the pixel idiom.
    shadowOffset: { width: border.shadowOffset, height: border.shadowOffset },
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowColor: colors.nightDeep,
    elevation: 0,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSize.bodySm,
    color: colors.text,
    textAlign: 'center',
  },
});

export const TOAST_VISIBLE_MS = VISIBLE_MS;
export const TOAST_FADE_MS = duration.fast;
