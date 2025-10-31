import { useState } from 'react';
import { Lock, Check, AlertCircle } from 'lucide-react';
import { styles } from '../styles/styles';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import { Key, ArrowLeft } from 'lucide-react';
import LanguageToggle from './LanguageToggle';

const ChangePassword = ({ user, onPasswordChanged, onBack }) => {
    const { t } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');

    // ❗ Insecure check – replace with Supabase Auth verification (see below)
    if (user.password_hash !== currentPassword) {
      setError(t.changePassword.errors.currentIncorrect);
      return;
    }

    if (newPassword.length < 6) {
      setError(t.changePassword.errors.tooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.changePassword.errors.noMatch);
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting to change password for user:', user.id);

      // ✅ Secure approach (recommended):
      // 1) Verify current password
      // const { error: signInErr } = await supabase.auth.signInWithPassword({
      //   email: user.email,
      //   password: currentPassword,
      // });
      // if (signInErr) throw signInErr;
      // 2) Update auth password
      // const { error: updateAuthErr } = await supabase.auth.updateUser({ password: newPassword });
      // if (updateAuthErr) throw updateAuthErr;

      // Your current table-based update (kept for compatibility):
      const { data, error: updateError } = await supabase
        .from('students')
        .update({
          password_hash: newPassword,
          first_login: false,
        })
        .eq('id', user.id)
        .select();

      if (updateError) {
        console.error('Supabase error:', updateError);
        throw updateError;
      }

      console.log('Password updated successfully:', data);

      alert(t.changePassword.success);
      onPasswordChanged({ ...user, password_hash: newPassword, first_login: false });
    } catch (err) {
      console.error('Error changing password:', err);
      setError(`${t.changePassword.errors.fillRequired} (${err.message})`);
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginContainer}>
  
  {/* ADD THIS BACK BUTTON */}
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

  {/* Rest of your existing code */}
      <div style={{ ...styles.loginBox, maxWidth: '500px' }}>
        <div style={styles.loginHeader}>
          <Lock size={48} color="#667eea" />
          <h1 style={styles.loginTitle}>{t.changePassword.title}</h1>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <LanguageToggle />
        </div>

        <div
          style={{
            background: '#fef3c7',
            border: '1px solid #fde68a',
            color: '#92400e',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            display: 'flex',
            gap: '12px',
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>{t.changePassword.firstTimeLogin}</strong>
            <p style={{ margin: '4px 0 0 0' }}>{t.changePassword.securityMessage}</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword}>
          <div style={styles.formGroup}>
            <label style={styles.label}>{t.changePassword.currentPassword}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t.changePassword.currentPasswordPlaceholder}
              required
              style={styles.input}
              autoFocus
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {t.changePassword.currentPasswordHint}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>{t.changePassword.newPassword}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t.changePassword.newPasswordPlaceholder}
              required
              minLength={6}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>{t.changePassword.confirmPassword}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.changePassword.confirmPasswordPlaceholder}
              required
              minLength={6}
              style={styles.input}
            />
          </div>

          {error && (
            <div
              style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#1e40af',
            }}
          >
            <strong>{t.changePassword.requirements}</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>{t.changePassword.minLength}</li>
              <li>{t.changePassword.mustMatch}</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              width: '100%',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              t.changePassword.changing
            ) : (
              <>
                <Check size={18} />
                {t.changePassword.changeButton}
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            background: '#f9fafb',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#666',
            textAlign: 'center',
          }}
        >
          {t.changePassword.loggedInAs}{' '}
          <strong>{user.email}</strong>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
