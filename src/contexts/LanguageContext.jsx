import { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../translations/en';
import { de } from '../translations/de';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('de'); // Default to German
  const [translations, setTranslations] = useState(de);

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app_language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'de')) {
      setLanguage(savedLanguage);
      setTranslations(savedLanguage === 'en' ? en : de);
    }
  }, []);

  const changeLanguage = (newLanguage) => {
    if (newLanguage === 'en' || newLanguage === 'de') {
      setLanguage(newLanguage);
      setTranslations(newLanguage === 'en' ? en : de);
      localStorage.setItem('app_language', newLanguage);
    }
  };

  const t = translations;

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};