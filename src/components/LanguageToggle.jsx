import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle = () => {
  const { language, changeLanguage } = useLanguage();

  const toggleLanguage = () => {
    changeLanguage(language === 'en' ? 'de' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      style={{
        background: '#667eea',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => e.target.style.background = '#5568d3'}
      onMouseOut={(e) => e.target.style.background = '#667eea'}
      title={language === 'en' ? 'Switch to German' : 'Zu Englisch wechseln'}
    >
      <Globe size={18} />
      {language === 'en' ? '🇩🇪 DE' : '🇬🇧 EN'}
    </button>
  );
};

export default LanguageToggle;