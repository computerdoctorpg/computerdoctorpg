import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to force clear local auth tokens
  const clearLocalAuthData = useCallback(() => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("Could not clear localStorage:", e);
    }
  }, []);

  const handleSession = useCallback(async (currentSession) => {
    if (currentSession?.user) {
      try {
        const { data: { user: validatedUser }, error: userError } = await supabase.auth.getUser();
        const activeUser = validatedUser || currentSession.user;

        if (userError && !validatedUser) {
          console.warn("Session validation warning:", userError.message);
        }

        let role = 'operater';
        if (activeUser?.id) {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('role')
              .eq('id', activeUser.id)
              .maybeSingle();

            if (error) {
              console.error('Error fetching user role from database:', error);
            } else if (data?.role) {
              role = data.role;
            }
          } catch (roleError) {
            console.error('Unexpected exception while fetching user role:', roleError);
          }
        }

        setUser({ ...activeUser, role });
        setSession(currentSession);
      } catch (err) {
        console.error('Unexpected error during session handling:', err);
        setUser(null);
        setSession(null);
        clearLocalAuthData();
      }
    } else {
      setUser(null);
      setSession(null);
    }
    setLoading(false);
  }, [clearLocalAuthData]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          handleSession(session);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          clearLocalAuthData();
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          if (_event === 'SIGNED_OUT' || _event === 'USER_DELETED') {
            setUser(null);
            setSession(null);
            clearLocalAuthData();
            setLoading(false);
          } else {
            handleSession(session);
          }
        }
      }
    );

    return () => {
      mounted = false;
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log("Attempting to sign out...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn("Supabase signOut returned an error:", error.message);
      }
    } catch (error) {
      console.error("Exception during signOut:", error);
    } finally {
      // Always clear the local auth state regardless of server response
      console.log("Forcing local auth state clear.");
      setUser(null);
      setSession(null);
      clearLocalAuthData();
      return { error: null }; // Return success to allow UI to proceed
    }
  }, [clearLocalAuthData]);

  const value = useMemo(() => {
    // Explicitly check for the admin email to ensure strict access control
    const isAdminUser = user?.email === 'prodaja@computer-doctor.me' || user?.role === 'admin';
    
    return {
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      currentUser: user, // user object contains the email
      isAdmin: isAdminUser
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