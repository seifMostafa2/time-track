import { useState, useEffect } from 'react';
import { Lock, Check, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const ResetPassword = ({ onSuccess, onBack }) => {
  const { t } = useLanguage();
  const { updatePassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if user has valid reset token - handles both query params and hash
  useEffect(() => {
    const checkRecoverySession = async () => {
      console.log('🔍 ResetPassword: Checking for recovery session...');

      // Check for errors in URL (expired/invalid token)
      const searchParams = new URLSearchParams(window.location.search);
      const urlError = searchParams.get('error');
      const errorCode = searchParams.get('error_code');
      const errorDescription = searchParams.get('error_description');

      if (urlError || errorCode) {
        console.error('❌ Password reset error:', errorCode || urlError);
        console.error('   Description:', errorDescription);

        if (errorCode === 'otp_expired') {
          setError('This password reset link has expired. Please request a new one.');
        } else if (urlError === 'access_denied') {
          setError('This password reset link is invalid or has expired. Please request a new one.');
        } else {
          setError(errorDescription || 'Invalid reset link. Please request a new one.');
        }
        setCheckingSession(false);
        return;
      }

      // Check hash format: #access_token=...&type=recovery
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashAccessToken = hashParams.get('access_token');
      const hashType = hashParams.get('type');

      // Check query parameter format: ?token=...&type=recovery
      const queryType = searchParams.get('type');
      const queryToken = searchParams.get('token');

      console.log('   Hash - Type:', hashType, 'Token:', !!hashAccessToken);
      console.log('   Query - Type:', queryType, 'Token:', !!queryToken);

      // If we have type=recovery in either format, check the actual session
      if (hashType === 'recovery' || queryType === 'recovery') {
        console.log('✅ Recovery type detected, checking session...');

        // Wait a moment for Supabase to process the token
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if we have a valid session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log('✅ Valid session found for password reset');
          setError(''); // Clear any errors
          setCheckingSession(false);
        } else {
          console.error('❌ No valid session found');
          setError('Invalid or expired reset link. Please request a new one.');
          setCheckingSession(false);
        }
      } else {
        // No recovery type in URL - this might be a refresh after successful token exchange
        // Check if we have an active session anyway
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log('✅ Active session found (likely after refresh)');
          setError(''); // Clear any errors
          setCheckingSession(false);
        } else {
          console.error('❌ No recovery session found and no active session');
          setError('Invalid or expired reset link. Please request a new one.');
          setCheckingSession(false);
        }
      }
    };

    checkRecoverySession();
  }, []);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await updatePassword(newPassword);

      if (updateError) {
        console.error('Password update error:', updateError);
        setError(updateError.message || 'Failed to update password');
        setLoading(false);
        return;
      }

      console.log('Password updated successfully');
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 3000);

    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while updating your password');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(90deg, hsla(196, 67%, 45%, 1) 0%, hsla(203, 50%, 13%, 1) 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          padding: '48px',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          width: '100%',
          maxWidth: '450px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#e0f2fe',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}>
            <Lock size={48} color="#2596BE" />
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#102430',
            marginBottom: '12px'
          }}>
            {t.common?.loading || 'Verifying reset link...'}
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#666'
          }}>
            Please wait...
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(90deg, hsla(196, 67%, 45%, 1) 0%, hsla(203, 50%, 13%, 1) 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          padding: '48px',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          width: '100%',
          maxWidth: '450px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#d1fae5',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <Check size={48} color="#065f46" />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#102430',
            marginBottom: '12px'
          }}>
            {t.resetPassword?.successTitle || 'Password Updated!'}
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '8px'
          }}>
            {t.resetPassword?.successMessage || 'Your password has been successfully updated.'}
          </p>
          <p style={{
            fontSize: '14px',
            color: '#999'
          }}>
            {t.resetPassword?.redirecting || 'Redirecting to login...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(90deg, hsla(196, 67%, 45%, 1) 0%, hsla(203, 50%, 13%, 1) 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.98)',
        padding: '48px',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '450px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <Lock size={64} color="#2596BE" style={{ marginBottom: '16px' }} />
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#102430',
            margin: '0 0 8px 0',
            textAlign: 'center'
          }}>
            {t.resetPassword?.title || 'Reset Your Password'}
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: 0,
            textAlign: 'center',
            lineHeight: '1.5'
          }}>
            {t.resetPassword?.subtitle || 'Enter your new password below'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* New Password */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              {t.resetPassword?.newPasswordLabel || 'New Password'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.resetPassword?.newPasswordPlaceholder || 'Enter new password'}
                required
                style={{
                  padding: '12px',
                  paddingRight: '40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '15px',
                  width: '100%',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#666" />
                ) : (
                  <Eye size={18} color="#666" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              {t.resetPassword?.confirmPasswordLabel || 'Confirm Password'}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.resetPassword?.confirmPasswordPlaceholder || 'Confirm new password'}
              required
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none'
              }}
            />
          </div>

          {/* Password Requirements */}
          <div style={{
            padding: '12px',
            background: '#f3f4f6',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#666'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>
              {t.resetPassword?.requirementsTitle || 'Password must contain:'}
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>{t.resetPassword?.requirement1 || 'At least 8 characters'}</li>
              <li>{t.resetPassword?.requirement2 || 'One uppercase letter'}</li>
              <li>{t.resetPassword?.requirement3 || 'One lowercase letter'}</li>
              <li>{t.resetPassword?.requirement4 || 'One number'}</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !!error}
            style={{
              padding: '14px 24px',
              background: (loading || error) ? '#9ca3af' : '#2596BE',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: (loading || error) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(37, 150, 190, 0.3)',
              width: '100%'
            }}
          >
            {loading ? (t.common?.loading || 'Updating Password...') : (t.resetPassword?.submitButton || 'Update Password')}
          </button>

          {/* Back to Login / Request New Link Button (shown when there's an error) */}
          {error && (
            <button
              type="button"
              onClick={onBack || (() => window.location.href = '/')}
              style={{
                padding: '14px 24px',
                background: 'transparent',
                color: '#2596BE',
                border: '2px solid #2596BE',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2596BE';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#2596BE';
              }}
            >
              <ArrowLeft size={18} />
              {t.common?.backToLogin || 'Back to Login'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;