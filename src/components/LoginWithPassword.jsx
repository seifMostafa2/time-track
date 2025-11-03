import { useState } from 'react';
import { Clock, Lock, Mail, AlertCircle } from 'lucide-react';
import { styles, theme  } from '../styles/styles';
import { useAuth } from '../contexts/AuthContext';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import logo from '../assets/ososoft-logo.png';




const LoginWithPassword = ({ onLogin, onForgotPassword }) => {
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate input
      if (!email || !password) {
        setError(t.login.fillAllFields);
        setLoading(false);
        return;
      }

      // Use Supabase Auth for login
      const { data, error: signInError } = await signIn(email, password);

      if (signInError) {
        console.error('Login error:', signInError);

        // Handle specific error cases
        if (signInError.message.includes('Invalid login credentials')) {
          setError(t.login.invalidCredentials);
        } else if (signInError.message.includes('Email not confirmed')) {
          setError(t.login.emailNotConfirmed || 'Please confirm your email address');
        } else {
          setError(t.login.genericError);
        }
        setLoading(false);
        return;
      }

      // Successful login
      console.log('Login successful for user:', data.user.email);
      onLogin();
    } catch (err) {
      console.error('Login error:', err);
      setError(t.login.genericError);
    } finally {
      setLoading(false);
    }
  };
return (
    <div style={styles.loginContainer}>
      {/* use loginCard from styles (rename to loginBox if you prefer) */}
      <div style={styles.loginCard}>
        {/* Top-right language toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <LanguageToggle />
        </div>

        {/* Header with Logo */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img
            src={logo}
            alt="Company Logo"
            style={styles.logo}
            draggable={false}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
          <div style={styles.loginHeader}>
            <Clock size={32} color={theme.teal} />
            <h1 style={styles.loginTitle}>{t.login.title}</h1>
          </div>
          <p style={styles.loginSubtitle}>{t.login.subtitle}</p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Email Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              {/* navy icons on light card */}
              <Mail size={16} color={theme.navy} style={{ display: 'inline', marginRight: 8 }} />
              {t.login.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.login.emailPlaceholder}
              required
              style={styles.input}
              autoFocus
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Lock size={16} color={theme.navy} style={{ display: 'inline', marginRight: 8 }} />
              {t.login.passwordLabel}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.login.passwordPlaceholder}
              required
              style={styles.input}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: theme.errorBg,
                border: '1px solid #FECACA',
                color: theme.errorText,
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              <AlertCircle size={16} color={theme.errorText} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.clockButton,      // primary teal button
              width: '100%',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = theme.tealBright)}
            onMouseLeave={(e) => (e.currentTarget.style.background = theme.teal)}
            onMouseDown={(e) => (e.currentTarget.style.background = theme.tealDim)}
            onMouseUp={(e) => (e.currentTarget.style.background = theme.tealBright)}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 16,
                    height: 16,
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                {t.login.loggingIn}
              </span>
            ) : (
              t.login.loginButton
            )}
          </button>

          {/* Forgot password link */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              type="button"
              onClick={onForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                color: theme.textOnLight,
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 14,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#2596BE')}
              onMouseLeave={(e) => (e.currentTarget.style.color = theme.textOnLight)}
            >
              {t.forgotPassword?.title || 'Forgot Password?'}
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div
          style={{
            marginTop: 20,
            fontSize: 14,
            color: 'rgba(173, 162, 162, 0.9)',
            textAlign: 'center',
          }}
        >
          {t.login.securityNotice || 'Your data is secure and encrypted'}
        </div>
      </div>

      {/* Add keyframe animation for loading spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoginWithPassword;