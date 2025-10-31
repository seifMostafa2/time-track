import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import LoadingScreen from './components/LoadingScreen';
import LoginWithPassword from './components/LoginWithPassword';
import ChangePassword from './components/ChangePassword';
import StudentView from './components/StudentView';
import AdminView from './components/AdminView';
import { LanguageProvider } from './contexts/LanguageContext';
import { Analytics } from "@vercel/analytics/react";
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

import HRView from './components/HRView';  

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('login');
  const [resetData, setResetData] = useState({ email: '', token: '' }); 

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
  const handleForgotPassword = () => {
  setActiveView('forgot-password');
};
const handleResetSent = (email, token) => {
  setResetData({ email, token });
  setActiveView('reset-password');
  alert('Reset-Link wurde generiert! (In Production würde eine E-Mail gesendet)');
};
const handleResetSuccess = () => {
  setResetData({ email: '', token: '' });
  setActiveView('login');
};
const handleBackToLogin = () => {
  setActiveView('login');
};

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
      setLoading(true);
      await refreshData();
      setLoading(false);
    };
    loadData();
  }, [refreshData]);

  const handleLogin = (user) => {
    setCurrentUser(user);

    // First-login password change flow
    if (user?.first_login) {
      setActiveView('change-password');
    }  else {
    // Check role and set view
    if (user?.role === 'admin') {
      setActiveView('admin');
    } else if (user?.role === 'hr') {
      setActiveView('hr');  // ADD THIS
    } else {
      setActiveView('student');
    }
  }
  };

const handlePasswordChanged = (updatedUser) => {
  setCurrentUser(updatedUser);
  if (updatedUser?.role === 'admin') {
    setActiveView('admin');
  } else if (updatedUser?.role === 'hr') {
    setActiveView('hr');  // ADD THIS
  } else {
    setActiveView('student');
  }
};

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('login');
  };

const renderView = () => {
  switch (activeView) {
    case 'login':
      return <LoginWithPassword onLogin={handleLogin} onForgotPassword={handleForgotPassword} />;
    
    case 'forgot-password':  // FIX: This was showing ForgotPassword but labeled as 'change-password'
      return <ForgotPassword onBack={handleBackToLogin} onResetSent={handleResetSent} />;
    
    case 'reset-password':
      return (
        <ResetPassword
          email={resetData.email}
          token={resetData.token}
          onBack={handleBackToLogin}
          onSuccess={handleResetSuccess}
        />
      );
      case 'hr':
  return (
    <HRView
      currentUser={currentUser}
      onLogout={handleLogout}
    />
  );
    
    case 'change-password':  // FIX: This was duplicated
      return (
        <ChangePassword 
          user={currentUser}
          onPasswordChanged={handlePasswordChanged}
          onBack={handleBackToLogin}
        />
      );
    
    case 'student':
      return (
        <StudentView
          currentUser={currentUser}
          timeEntries={timeEntries}
          onLogout={handleLogout}
          onRefresh={refreshData}
        />
      );
    
    case 'admin':
      return (
        <AdminView
          currentUser={currentUser}
            students={students}
            timeEntries={timeEntries}
            onLogout={handleLogout}
            onRefresh={refreshData}
          />
        );
      
      default:
        return null;
    }
  };

  
  return (
    
    <LanguageProvider>
      <Analytics /> 
      {loading ? <LoadingScreen /> : renderView()}
    </LanguageProvider>
  );
};

export default App;
