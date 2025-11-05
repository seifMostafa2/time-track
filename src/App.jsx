import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import LoadingScreen from './components/LoadingScreen';
import LoginWithPassword from './components/LoginWithPassword';
import ChangePassword from './components/ChangePassword';
import StudentView from './components/StudentView';
import AdminView from './components/AdminView';
import HRView from './components/HRView';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Analytics } from "@vercel/analytics/react";

const AppContent = () => {
  const { user, userProfile, loading: authLoading, signOut } = useAuth();
  const [students, setStudents] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize activeView - check URL first, then sessionStorage
  const [activeView, setActiveView] = useState(() => {
    // Check if we're on a password reset link
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryType = urlParams.get('type');
    const hashType = hashParams.get('type');

    if (queryType === 'recovery' || hashType === 'recovery') {
      console.log('🔗 Password reset link detected on initial load');
      return 'reset-password';
    }

    // Otherwise use saved view or default to login
    const savedView = sessionStorage.getItem('activeView');
    return savedView || 'login';
  });

  const fetchStudents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('id');

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      alert('Error loading students');
    }
  }, []);

  const fetchTimeEntries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setTimeEntries(data || []);
    } catch (err) {
      console.error('Error fetching time entries:', err);
      alert('Error loading time entries');
    }
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchStudents(), fetchTimeEntries()]);
  }, [fetchStudents, fetchTimeEntries]);

  useEffect(() => {
    const loadData = async () => {
      if (!authLoading) {
        setLoading(true);
        await refreshData();
        setLoading(false);
      }
    };
    loadData();
  }, [refreshData, authLoading]);

  // Save activeView to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('activeView', activeView);
    console.log('💾 Saved activeView to sessionStorage:', activeView);
  }, [activeView]);

  // CRITICAL: Check for special pages URL FIRST - handles ALL formats!
  useEffect(() => {
    const checkForSpecialPages = () => {
      console.log('🔍 Checking URL for special pages...');
      console.log('   Full URL:', window.location.href);

      // Check for error in URL (expired/invalid token)
      const searchParams = new URLSearchParams(window.location.search);
      const error = searchParams.get('error');
      const errorCode = searchParams.get('error_code');
      const errorDescription = searchParams.get('error_description');

      if (error || errorCode) {
        console.error('❌ Password reset error:', errorCode || error);
        console.error('   Description:', errorDescription);

        // Show reset password page with error
        if (window.location.pathname === '/reset-password' ||
            errorCode === 'otp_expired' ||
            error === 'access_denied') {
          setActiveView('reset-password');
          return true;
        }
      }

      // Check hash format: #access_token=...&type=recovery (after Supabase processes the token)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashType = hashParams.get('type');
      const hashAccessToken = hashParams.get('access_token');

      // Check query parameter format: ?token=...&type=recovery (from email link)
      const queryType = searchParams.get('type');
      const queryToken = searchParams.get('token');

      console.log('   Hash format - Type:', hashType, 'Token:', !!hashAccessToken);
      console.log('   Query format - Type:', queryType, 'Token:', !!queryToken);

      // Check ALL formats - including just type=recovery without token yet
      if (hashType === 'recovery' || queryType === 'recovery') {
        console.log('✅ Password recovery detected - showing reset password page');
        setActiveView('reset-password');
        return true;
      }

      console.log('   No special page found');
      return false;
    };

    // Check immediately on mount
    const hasSpecialPage = checkForSpecialPages();

    // If we found a recovery token, also listen for hash changes
    // (Supabase might update the URL after token exchange)
    if (hasSpecialPage) {
      const handleHashChange = () => {
        console.log('🔄 URL hash changed, rechecking...');
        checkForSpecialPages();
      };

      window.addEventListener('hashchange', handleHashChange);

      return () => {
        window.removeEventListener('hashchange', handleHashChange);
      };
    }
  }, []); // Empty dependency - only run once on mount

  // Handle auth state changes - RUNS AFTER recovery check
  useEffect(() => {
    // CRITICAL: Don't override if we're on reset-password or forgot-password page
    if (activeView === 'reset-password') {
      console.log('🔒 Preserving reset-password view');
      return;
    }

    if (activeView === 'forgot-password') {
      console.log('🔒 Preserving forgot-password view');
      return;
    }

    if (!authLoading) {
      if (user) {
        // User has a session (might be recovery session or normal login)
        console.log('✅ User session exists:', user.email);

        // If we have a user but no profile yet, wait for profile to load
        if (!userProfile) {
          console.log('⏳ Waiting for user profile to load...');
          return;
        }

        console.log('✅ User profile loaded:', userProfile.email, 'Role:', userProfile.role);

        // Don't redirect if user is on forgot-password or reset-password
        // (they might be logged in but want to reset password)
        if (activeView === 'forgot-password' || activeView === 'reset-password') {
          console.log('🔒 User on password reset flow, not redirecting');
          return;
        }

        // Removed first_login check - users can use "Forgot Password" instead
        if (userProfile.role === 'admin') {
          console.log('→ Admin role, showing admin view');
          setActiveView('admin');
        } else if (userProfile.role === 'hr') {
          console.log('→ HR role, showing HR view');
          setActiveView('hr');
        } else {
          console.log('→ Student role, showing student view');
          setActiveView('student');
        }
      } else {
        // User is not authenticated
        console.log('❌ User not authenticated');
        // Only set to login if we're not on a special page
        if (activeView !== 'reset-password' && activeView !== 'forgot-password') {
          console.log('→ Showing login');
          setActiveView('login');
        }
      }
    }
  }, [user, userProfile, authLoading, activeView]);

  const handleLogin = async () => {
    console.log('Login successful, refreshing data');
    sessionStorage.removeItem('activeView'); // Clear saved view on login
    await refreshData();
  };

  const handlePasswordChanged = async () => {
    console.log('Password changed, refreshing data');
    sessionStorage.removeItem('activeView'); // Clear saved view after password change
    await refreshData();
  };

  const handleLogout = async () => {
    console.log('Logging out');
    sessionStorage.removeItem('activeView'); // Clear saved view on logout
    await signOut();
    setActiveView('login');
  };

  const handleForgotPassword = () => {
    console.log('🔄 Switching to forgot password view');
    setActiveView('forgot-password');
  };

  const handleBackToLogin = () => {
    console.log('🔄 Returning to login view');
    sessionStorage.removeItem('activeView'); // Clear saved view
    setActiveView('login');
  };

  const handleResetSuccess = () => {
    console.log('✅ Password reset successful, redirecting to login');
    // Clear URL hash and query parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    setActiveView('login');
  };

  const renderView = () => {
    console.log('📺 Rendering view:', activeView);
    
    switch (activeView) {
      case 'login':
        return (
          <LoginWithPassword 
            onLogin={handleLogin} 
            onForgotPassword={handleForgotPassword} 
          />
        );

      case 'forgot-password':
        return (
          <ForgotPassword 
            onBack={handleBackToLogin} 
          />
        );

      case 'reset-password':
        return (
          <ResetPassword
            onSuccess={handleResetSuccess}
            onBack={handleBackToLogin}
          />
        );

      case 'change-password':
        return (
          <ChangePassword
            onPasswordChanged={handlePasswordChanged}
            onBack={handleBackToLogin}
          />
        );

      case 'student':
        return (
          <StudentView
            currentUser={userProfile}
            timeEntries={timeEntries}
            onLogout={handleLogout}
            onRefresh={refreshData}
          />
        );

      case 'admin':
        return (
          <AdminView
            currentUser={userProfile}
            students={students}
            timeEntries={timeEntries}
            onLogout={handleLogout}
            onRefresh={refreshData}
          />
        );

      case 'hr':
        return (
          <HRView
            currentUser={userProfile}
            onLogout={handleLogout}
          />
        );

      default:
        console.warn('⚠️  Unknown view:', activeView);
        return null;
    }
  };

  return (
    <>
      <Analytics />
      {(loading || authLoading) ? <LoadingScreen /> : renderView()}
    </>
  );
};

const App = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;