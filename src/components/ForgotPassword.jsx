import { useState, useEffect } from 'react';
import { Mail, ArrowLeft, Check, Clock } from 'lucide-react';
import { styles } from '../styles/styles';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../supabaseClient'; // ADD THIS

const ForgotPassword = ({ onBack }) => {
  const { t } = useLanguage();
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setSuccess(false);

    try {
      // CHECK IF EMAIL EXISTS IN DATABASE
      const { data: user, error: checkError } = await supabase
        .from('students')
        .select('id, email, name')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (checkError || !user) {
        setMessage(t.forgotPassword?.emailNotFound || 'Kein Konto mit dieser E-Mail-Adresse gefunden.');
        setLoading(false);
        return;
      }

      // Email exists, proceed with reset
      const { error } = await resetPasswordForEmail(email.toLowerCase().trim());

      if (error) {
        console.error('Password reset error:', error);

        if (error.code === 'account_not_migrated') {
          setMessage(t.forgotPassword?.accountNotMigrated || 'Dieses Konto muss migriert werden. Bitte kontaktieren Sie Ihren Administrator.');
        } else {
          setMessage(error.message || t.forgotPassword?.error || 'Fehler beim Senden des Reset-Links');
        }

        setLoading(false);
        return;
      }

      setSuccess(true);
      setMessage(t.forgotPassword?.success || 'Reset-Link wurde an Ihre E-Mail gesendet. Bitte überprüfen Sie Ihr Postfach.');

      // Start 100 second cooldown
      setCooldown(100);

    } catch (err) {
      console.error('Error:', err);
      setMessage(t.forgotPassword?.error || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

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
        position: 'relative'
      }}>
        {/* Back Button */}
        <button
          onClick={onBack}
          type="button"
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
            color: '#2596BE',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          <ArrowLeft size={20} />
          {t.common?.back || 'Back'}
        </button>

        {/* Header - Vertical */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '24px',
          marginBottom: '32px'
        }}>
          <Mail size={64} color="#2596BE" style={{ marginBottom: '16px' }} />
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#102430',
            margin: '0 0 8px 0',
            textAlign: 'center'
          }}>
            {t.forgotPassword?.title || 'Forgot Password'}
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: 0,
            textAlign: 'center',
            lineHeight: '1.5'
          }}>
            {t.forgotPassword?.subtitle || 'Enter your email to reset your password'}
          </p>
        </div>

        {/* Form - Vertical */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
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
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
            />
          </div>

          {message && (
            <div style={{
              padding: '12px',
              background: success ? '#d1fae5' : '#fee2e2',
              border: `1px solid ${success ? '#a7f3d0' : '#fecaca'}`,
              borderRadius: '8px',
              color: success ? '#065f46' : '#991b1b',
              fontSize: '14px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {success && <Check size={18} />}
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || cooldown > 0}
            style={{
              padding: '14px 24px',
              background: (loading || cooldown > 0) ? '#9ca3af' : '#2596BE',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: (loading || cooldown > 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(37, 150, 190, 0.3)',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <>{t.common?.loading || 'Loading...'}</>
            ) : cooldown > 0 ? (
              <>
                <Clock size={18} />
                {t.forgotPassword?.waitSeconds?.replace('{seconds}', cooldown) || `Wait ${cooldown}s`}
              </>
            ) : (
              <>{t.forgotPassword?.sendButton || 'Send Reset Link'}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;