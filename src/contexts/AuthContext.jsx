import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from students table
  const fetchUserProfile = async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (error) throw error;

      // Fetch user profile after successful login
      if (data.user) {
        await fetchUserProfile(data.user.id);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };

  // Sign up new user
  const signUp = async (email, password, userData) => {
    try {
      console.log('🔵 Starting user creation for:', email);

      // Store current session to restore it later
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('💾 Saved current admin session');

      // Create auth user (this will temporarily log in as the new user)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
          },
        },
      });

      if (authError) {
        console.error('❌ Auth user creation failed:', authError);
        throw authError;
      }

      console.log('✅ Auth user created:', authData.user?.id);

      // Check if user was created successfully
      if (!authData.user) {
        throw new Error('User creation failed - no user returned');
      }

      // Manually create the students record (in case trigger doesn't exist)
      console.log('🔵 Creating students record...');
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          auth_user_id: authData.user.id,
          email: email.toLowerCase().trim(),
          name: userData.name,
          role: userData.role,
          first_login: true,
        });

      if (studentError) {
        console.error('❌ Students record creation failed:', studentError);
        // If it's a duplicate key error, it means the trigger already created it
        if (!studentError.message.includes('duplicate key')) {
          throw studentError;
        } else {
          console.log('✅ Students record already exists (created by trigger)');
        }
      } else {
        console.log('✅ Students record created manually');
      }

      // Restore the admin session
      if (currentSession) {
        console.log('🔄 Restoring admin session...');
        await supabase.auth.setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
        });
        console.log('✅ Admin session restored');
      }

      console.log('✅ User and profile created successfully');
      return { data: authData, error: null };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { data: null, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      // Ignore "Auth session missing" error - user is already logged out
      if (error && error.message !== 'Auth session missing!') {
        console.error('Sign out error:', error);
      }

      // Always clear local state regardless of error
      setUser(null);
      setUserProfile(null);
      sessionStorage.removeItem('activeView');

      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);

      // Still clear local state even if error occurs
      setUser(null);
      setUserProfile(null);
      sessionStorage.removeItem('activeView');

      return { error: null }; // Return success since we cleared local state
    }
  };

  // Reset password for email - THIS IS THE KEY FIX
  const resetPasswordForEmail = async (email) => {
    try {
      // Get the current window location for redirect
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      console.log('Sending password reset to:', email);
      console.log('Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: redirectUrl,
        }
      );

      if (error) {
        console.error('Reset password error:', error);
        throw error;
      }

      console.log('Password reset email sent successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  };

  // Update password (called after user clicks reset link)
  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;