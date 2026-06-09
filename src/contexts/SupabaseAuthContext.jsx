import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { getOperatorDisplayName } from '@/lib/operatorAuth';
import { fetchUserProfile } from '@/lib/fetchUserProfile';

const AuthContext = createContext(undefined);

const FRESH_AUTH_EVENTS = new Set(['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED']);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionRunRef = useRef(0);
  const initialSessionHandledRef = useRef(false);

  const clearLocalAuthData = useCallback(() => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }
  }, []);

  const handleSession = useCallback(async (currentSession, event = 'UNKNOWN') => {
    const runId = ++sessionRunRef.current;
    const isFreshAuth = FRESH_AUTH_EVENTS.has(event);

    try {
      if (currentSession?.user) {
        let activeSession = currentSession;
        let activeUser = currentSession.user;

        if (!isFreshAuth) {
          const { data: { user: validatedUser }, error: userError } = await supabase.auth.getUser();
          if (runId !== sessionRunRef.current) return;

          if (validatedUser) {
            activeUser = validatedUser;
          } else if (userError) {
            const staleSession =
              /session/i.test(userError.message || '') ||
              userError.status === 401 ||
              userError.status === 403;

            if (staleSession) {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              if (runId !== sessionRunRef.current) return;

              if (refreshError || !refreshData?.session?.user) {
                setUser(null);
                setSession(null);
                clearLocalAuthData();
                return;
              }

              activeSession = refreshData.session;
              activeUser = refreshData.session.user;
            }
          }
        }

        let role = 'operater';
        let displayName = '';
        if (activeUser?.id) {
          try {
            const data = await fetchUserProfile(supabase, activeUser.id);
            if (runId !== sessionRunRef.current) return;
            if (data?.role) role = data.role;
            displayName = data?.display_name || '';
          } catch (roleError) {
            console.error('Unexpected exception while fetching user role:', roleError);
          }
        }

        if (runId !== sessionRunRef.current) return;

        setUser({
          ...activeUser,
          role,
          displayName: displayName || getOperatorDisplayName(activeUser),
        });
        setSession(activeSession);
      } else {
        if (runId !== sessionRunRef.current) return;
        setUser(null);
        setSession(null);
      }
    } catch (err) {
      if (runId !== sessionRunRef.current) return;
      console.error('Unexpected error during session handling:', err);
      setUser(null);
      setSession(null);
      clearLocalAuthData();
    } finally {
      if (runId === sessionRunRef.current) {
        setLoading(false);
      }
    }
  }, [clearLocalAuthData]);

  useEffect(() => {
    let mounted = true;

    const scheduleSession = (nextSession, event) => {
      // Supabase: ne zovi auth API direktno unutar onAuthStateChange — deadlock
      setTimeout(() => {
        if (mounted) {
          handleSession(nextSession, event);
        }
      }, 0);
    };

    supabase.auth.getSession()
      .then(({ data: { session: initialSession }, error }) => {
        if (!mounted) return;
        initialSessionHandledRef.current = true;
        if (error) {
          console.error('Error checking auth session:', error);
          clearLocalAuthData();
          setLoading(false);
          return;
        }
        scheduleSession(initialSession, 'INITIAL_SESSION');
      })
      .catch((error) => {
        if (!mounted) return;
        console.error('Error checking auth session:', error);
        clearLocalAuthData();
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!mounted) return;

        if (event === 'INITIAL_SESSION') {
          if (!initialSessionHandledRef.current) {
            initialSessionHandledRef.current = true;
            scheduleSession(nextSession, event);
          }
          return;
        }

        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          sessionRunRef.current += 1;
          setUser(null);
          setSession(null);
          clearLocalAuthData();
          setLoading(false);
          return;
        }

        scheduleSession(nextSession, event);
      },
    );

    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [handleSession, clearLocalAuthData]);

  const signUp = useCallback(async (email, password, options = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    try {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Supabase signOut returned an error:', error.message);
      }
    } catch (error) {
      console.error('Exception during signOut:', error);
    } finally {
      sessionRunRef.current += 1;
      setUser(null);
      setSession(null);
      clearLocalAuthData();
      return { error: null };
    }
  }, [clearLocalAuthData]);

  const value = useMemo(() => {
    const isAdminUser = user?.email === 'prodaja@computer-doctor.me' || user?.role === 'admin';
    const isOperaterUser = !isAdminUser;

    return {
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      currentUser: user,
      isAdmin: isAdminUser,
      isOperater: isOperaterUser,
    };
  }, [user, session, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
