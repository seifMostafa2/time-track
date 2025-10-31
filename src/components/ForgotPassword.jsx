import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { styles } from '../styles/styles';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';

const ForgotPassword = ({ onBack, onResetSent }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data: user, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error || !user) {
        setMessage('E-Mail nicht gefunden');
        setLoading(false);
        return;
      }

      const resetToken = Math.random().toString(36).substr(2, 9);
      
      const { error: updateError } = await supabase
        .from('students')
        .update({ reset_token: resetToken })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onResetSent(email, resetToken);
      
    } catch (err) {
      console.error('Error:', err);
      setMessage('Fehler aufgetreten');
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
          Zurück
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
            Passwort vergessen
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: 0,
            textAlign: 'center',
            lineHeight: '1.5'
          }}>
            Gib deine E-Mail ein, um dein Passwort zurückzusetzen
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
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px 24px',
              background: loading ? '#9ca3af' : '#2596BE',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(37, 150, 190, 0.3)',
              width: '100%'
            }}
          >
            {loading ? 'Lädt...' : 'Reset-Link senden'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;