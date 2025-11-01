import { useState } from 'react';
import { Clock, Lock, Mail } from 'lucide-react';
import { styles } from '../styles/styles';
import { supabase } from '../supabaseClient';
import logo from '@/assets/ososoft-logo.png';

const LoginWithPassword = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Query the database for the user
      const { data, error: queryError } = await supabase
        .from('students')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (queryError || !data) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      // Check password (in production, use proper password hashing)
      if (data.password_hash !== password) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      // Successful login
      onLogin(data);
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginBox}>
        
    <div style={styles.loginHeader}>
  <img
    src={logo}
    alt="Company logo"
    style={styles.logo}
    draggable={false}
  />
</div>
        <p style={styles.loginSubtitle}>Student Time Tracking System</p>
        
        <form onSubmit={handleLogin}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Mail size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              style={styles.input}
              autoFocus
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Lock size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={styles.input}
            />
          </div>

          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
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
              width: '100%',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>Default Admin:</strong><br />
          Email: name@company.com<br />
          Password: admin123
        </div>
      </div>
    </div>
  );
};

export default LoginWithPassword;