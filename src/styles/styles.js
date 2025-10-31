// src/styles/styles.js

// ---------- THEME ----------
export const theme = {
  teal: '#2596BE',
  navy: '#102430',
  tealBright: '#2BA9D6',
  tealDim: '#1F88AA',
  aqua: '#AEE6FA',
  aquaDim: '#8ED6F3',
  textOnDark: '#EAF7FD',
  subOnDark: 'rgba(234,247,253,0.75)',
  textOnLight: '#102430',
  subOnLight: '#5B6B75',
  errorBg: '#FEE2E2',
  errorText: '#7F1D1D',
  ring: 'rgba(37,150,190,0.45)',
};

// ---------- FOCUS RING ----------
export const focusRing = {
  outline: '2px solid transparent',
  boxShadow: `0 0 0 3px ${theme.ring}`,
};

// ---------- STYLES ----------
const styles = {
  // APP & NAV
  app: {
    minHeight: '100vh',
    background:
      'linear-gradient(90deg, hsla(196, 67%, 45%, 1) 0%, hsla(203, 50%, 13%, 1) 100%)',
  },
  navbar: {
    background: 'rgba(16, 36, 48, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: `1px solid ${theme.teal}4D`,
    padding: '16px 0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  navContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  navTitle: { fontSize: '24px', fontWeight: 'bold', color: theme.teal, margin: 0 },
  navSubtitle: { fontSize: '14px', color: theme.subOnDark, margin: 0 },

  container: { maxWidth: '1400px', margin: '0 auto', padding: '24px' },

  // BUTTONS
  button: {
    padding: '12px 24px',
    background: theme.teal,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 2px 10px rgba(37,150,190,0.35)',
  },
  exportButton: {
    padding: '12px 24px',
    background: theme.navy,
    color: '#fff',
    border: `1px solid ${theme.teal}`,
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  // CARDS / TEXT
  card: {
    background: 'rgba(255,255,255,0.95)',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginBottom: '24px',
    border: `1px solid ${theme.teal}33`,
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: theme.textOnLight,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    background: 'rgba(255,255,255,0.95)',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: `1px solid ${theme.teal}33`,
    transition: 'transform 0.2s',
  },
  statLabel: { fontSize: '14px', color: theme.subOnLight, marginBottom: '8px' },
  statValue: { fontSize: '32px', fontWeight: 'bold', color: theme.textOnLight },

  table: { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: `2px solid ${theme.teal}`,
    fontWeight: '600',
    color: theme.textOnLight,
    fontSize: '14px',
  },
  td: { padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: theme.textOnLight },

  // BADGES
  badge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', display: 'inline-block' },
  badgeApproved: { background: '#DCFCE7', color: '#065F46' },
  badgeRejected: { background: '#FEE2E2', color: '#7F1D1D' },
  badgePending: { background: '#FEF3C7', color: '#92400E' },

  buttonGroup: { display: 'flex', gap: '8px' },
  approveButton: { padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
  rejectButton: { padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
  emptyState: { textAlign: 'center', padding: '48px', color: 'rgba(16,36,48,0.55)', fontSize: '16px' },

  // LOGIN
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'linear-gradient(90deg, hsla(196, 67%, 45%, 1) 0%, hsla(203, 50%, 13%, 1) 100%)',
    padding: '20px',
  },
  loginCard: {
    background: 'rgba(255,255,255,0.98)',
    padding: '36px',
    borderRadius: '16px',
    boxShadow: '0 16px 50px rgba(0,0,0,0.28)',
    width: '100%',
    maxWidth: '520px',
    position: 'relative',
    border: `1px solid ${theme.teal}4D`,
  },
  loginHeader: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px', textAlign: 'center' },
  loginTitle: { fontSize: '24px', fontWeight: '800', color: theme.textOnLight, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' },
  loginSubtitle: { fontSize: '14px', color: theme.subOnLight, textAlign: 'center', marginTop: '4px', marginBottom: '22px' },

  loginForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },

  input: {
    height: '48px',
    padding: '0 14px',
    border: '1px solid rgba(16,36,48,0.15)',
    borderRadius: '10px',
    fontSize: '15px',
    outline: 'none',
    color: theme.textOnLight,
    background: '#fff',
  },
  select: {
    height: '48px',
    padding: '0 14px',
    border: '1px solid rgba(16,36,48,0.15)',
    borderRadius: '10px',
    fontSize: '15px',
    outline: 'none',
    background: '#fff',
    color: theme.textOnLight,
  },

  iconButton: { padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  clockButton: {
    padding: '0 24px',
    height: '48px',
    fontSize: '16px',
    fontWeight: '700',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    background: theme.teal,
    color: '#fff',
  },
  clockInButton: { background: theme.teal, color: '#fff' },
  clockOutButton: { background: theme.navy, color: '#fff' },

  liveClock: {
    background: 'rgba(255,255,255,0.95)',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginBottom: '24px',
    textAlign: 'center',
    border: `1px solid ${theme.teal}33`,
  },
  liveClockTime: { fontSize: '48px', fontWeight: 'bold', color: theme.teal, marginBottom: '8px' },
  liveClockDate: { fontSize: '18px', color: theme.subOnLight },

  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    background: 'rgba(255,255,255,0.96)',
    padding: '8px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: `1px solid ${theme.teal}33`,
    overflowX: 'auto',
  },
  tab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    color: theme.subOnLight,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
      color: '#ffffff',  // Changed to white

  },
  activeTab: {
    padding: '12px 24px',
    background:
      'linear-gradient(90deg, hsla(196, 67%, 45%, 1) 0%, hsla(203, 50%, 13%, 1) 100%)',
      
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
  color: '#ffffff',  // Changed to white
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 2px 8px rgba(37,150,190,0.4)',
  },

  languageToggle: { display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '8px' },
  languageButton: { padding: '8px 16px', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', transition: 'all 0.2s' },
  activeLanguage: { padding: '8px 16px', background: theme.teal, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#fff', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(37,150,190,0.4)' },
};

// Legacy alias (if some JSX still uses loginBox)
styles.loginBox = styles.loginCard;

// SINGLE named export:
export { styles };
