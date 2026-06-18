import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { withTimeout, AUTH_TIMEOUT_MS } from '../utils/withTimeout';
import { identifyPurchasesUser, logOutPurchases } from '../billing/revenuecat';

export const SIGN_OUT_ERROR_MESSAGE = 'Unable to sign out. Please try again.';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isSessionCheckFailed: boolean;
  retrySessionCheck: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionCheckFailed, setIsSessionCheckFailed] = useState(false);
  const isCheckingRef = useRef(false);

  function runSessionCheck() {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setIsLoading(true);
    setIsSessionCheckFailed(false);

    withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS)
      .then(({ data }) => {
        setSession(data.session);
        setIsSessionCheckFailed(false);
      })
      .catch(() => {
        // Timeout or network failure — do not clear session
        setIsSessionCheckFailed(true);
      })
      .finally(() => {
        setIsLoading(false);
        isCheckingRef.current = false;
      });
  }

  useEffect(() => {
    runSessionCheck();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setIsSessionCheckFailed(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user.id) return;
    identifyPurchasesUser(session.user.id).catch(() => {
      // Billing initialization is retried on the subscription screen.
    });
  }, [session?.user.id]);

  async function signOut(): Promise<void> {
    await logOutPurchases().catch(() => undefined);
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(SIGN_OUT_ERROR_MESSAGE);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isLoading, isSessionCheckFailed, retrySessionCheck: runSessionCheck, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
