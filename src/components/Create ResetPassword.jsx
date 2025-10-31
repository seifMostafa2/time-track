import { useState } from 'react';
import { Key, ArrowLeft } from 'lucide-react';
import { styles } from '../styles/styles';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';

const ResetPassword = ({ email, token, onBack, onSuccess }) => {
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError(t.changePassword?.passwordTooShort || 'Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.changePassword?.passwordMismatch || 'Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);

    try {
      // Verify token and update password
      const { data: user, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('reset_token', token)
        .single();

      if (fetchError || !user) {
        setError(t.resetPassword?.invalidToken || 'Ungültiger oder abgelaufener Reset-Link');
        setLoading(false);
        return;
      }

      // Update password and clear token
      const { error: updateError } = await supabase
        .from('students')
        .update({
          password_hash: newPassword,
          reset_token: null,
          first_login: false
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      alert(t.resetPassword?.success || 'Passwort erfolgreich geändert!');
      onSuccess();

    } catch (err) {
      console.error('Error:', err);
      setError(t.common?.error || 'Fehler beim Zurücksetzen');
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#667eea',
            fontSize: '14px'
          }}
        >
          <ArrowLeft size={20} />
          {t.common?.back || 'Zurück'}
        </button>

        <div style={styles.loginHeader}>
          <Key size={48} color="#667eea" />
          <h1 style={styles.loginTitle}>
            {t.resetPassword?.title || 'Neues Passwort'}
          </h1>
          <p style={styles.loginSubtitle}>
            {t.resetPassword?.subtitle || 'Erstelle ein neues Passwort für'} {email}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.loginForm}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              {t.changePassword?.newPassword || 'Neues Passwort'}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              {t.changePassword?.confirmPassword || 'Passwort bestätigen'}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (t.common?.loading || 'Lädt...') : (t.resetPassword?.resetButton || 'Passwort ändern')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;