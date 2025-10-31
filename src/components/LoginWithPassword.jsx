import { useState } from 'react';
import { Clock, Lock, Mail, AlertCircle } from 'lucide-react';
import { styles, theme  } from '../styles/styles';
import { supabase } from '../supabaseClient';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';




const LoginWithPassword = ({ onLogin, onForgotPassword }) => {
  const { t } = useLanguage();
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

      // Query the database for the user
      const { data, error: queryError } = await supabase
        .from('students')
        .select('*')
        .eq('email', email.toLowerCase().trim());

      // Handle database errors
      if (queryError) {
        console.error('Database query error:', queryError);
        setError(t.login.genericError);
        setLoading(false);
        return;
      }

      // Check if user exists
      if (!data || data.length === 0) {
        setError(t.login.invalidCredentials);
        setLoading(false);
        return;
      }

      const user = data[0];

      // NOTE: This is still using plain text password comparison
      // TODO: Implement proper password hashing with bcrypt
      // For now, keeping the existing logic but with better structure
      if (user.password_hash !== password) {
        setError(t.login.invalidCredentials);
        setLoading(false);
        return;
      }

      // Check if account is active (if you have this field)
      if (user.status && user.status === 'inactive') {
        setError(t.login.accountInactive);
        setLoading(false);
        return;
      }

      // Successful login
      console.log('Login successful for user:', user.email);
      
      // Update last login timestamp (optional)
      //await supabase
       // .from('students')
       // .update({ last_login: new Date().toISOString() })
       // .eq('id', user.id);

      onLogin(user);
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

        {/* Header with Clock + Title */}
        <div style={styles.loginHeader}>
          {/* aqua icon on dark gradient */}
          <Clock size={48} color={theme.aqua} />
          <h1 style={styles.loginTitle}>{t.login.title}</h1>
        </div>

        <p style={styles.loginSubtitle}>{t.login.subtitle}</p>

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

          {/* Forgot password link (aqua on dark) */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
<div style={{ textAlign: 'center', marginTop: 16 }}>
  <button
    type="button"
    onClick={() => onForgotPassword && onForgotPassword()}
    style={{
      background: 'none',
      border: 'none',
      color: theme.textOnLight,   // <- black/dark text
      textDecoration: 'underline',
      cursor: 'pointer',
      fontSize: 14,
    }}
    onMouseEnter={(e) => (e.currentTarget.style.color = theme.textOnLight)}
    onMouseLeave={(e) => (e.currentTarget.style.color = theme.textOnLight)}
  >
    {t.forgotPassword.title}
  </button>
</div>

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