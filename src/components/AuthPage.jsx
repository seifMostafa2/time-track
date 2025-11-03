import { useState } from 'react';
import LoginWithPassword from './LoginWithPassword';
import ForgotPassword from './ForgotPassword';

const AuthPage = () => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = () => {
    // This will be handled by your AuthContext
    // The app should automatically redirect when user is authenticated
    console.log('Login successful');
  };

  const handleForgotPassword = () => {
    console.log('Switching to forgot password view');
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    console.log('Returning to login view');
    setShowForgotPassword(false);
  };

  return (
    <>
      {showForgotPassword ? (
        <ForgotPassword onBack={handleBackToLogin} />
      ) : (
        <LoginWithPassword 
          onLogin={handleLogin}
          onForgotPassword={handleForgotPassword}
        />
      )}
    </>
  );
};

export default AuthPage;