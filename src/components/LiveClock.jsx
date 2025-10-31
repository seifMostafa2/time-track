import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LiveClock = () => {
  const { t } = useLanguage();
  const lang = (t?.__lang || 'en').toLowerCase(); // set this in your provider, e.g., 'de' | 'en'

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    // German → 24h, otherwise 12h as default
    const hour12 = lang !== 'de';
    try {
      return date.toLocaleTimeString(lang === 'de' ? 'de-DE' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12,
      });
    } catch {
      return date.toLocaleTimeString();
    }
  };

  const formatDate = (date) => {
    // Build with your i18n dictionaries
    const dayIdx = date.getDay(); // 0=Sun ... 6=Sat
    const monthIdx = date.getMonth(); // 0=Jan ... 11=Dec

    const days = t?.clock?.days || {};
    const months = t?.clock?.months || {};

    const dayName =
      [
        days.sunday || 'Sunday',
        days.monday || 'Monday',
        days.tuesday || 'Tuesday',
        days.wednesday || 'Wednesday',
        days.thursday || 'Thursday',
        days.friday || 'Friday',
        days.saturday || 'Saturday',
      ][dayIdx] || date.toLocaleDateString(undefined, { weekday: 'long' });

    const monthName =
      [
        months.january || 'January',
        months.february || 'February',
        months.march || 'March',
        months.april || 'April',
        months.may || 'May',
        months.june || 'June',
        months.july || 'July',
        months.august || 'August',
        months.september || 'September',
        months.october || 'October',
        months.november || 'November',
        months.december || 'December',
      ][monthIdx] || date.toLocaleDateString(undefined, { month: 'long' });

    const dayNum = date.getDate();
    const year = date.getFullYear();

    // de: "Montag, 24. Juni 2025" | en: "Monday, June 24, 2025"
    if (lang === 'de') {
      return `${dayName}, ${dayNum}. ${monthName} ${year}`;
    }
    return `${dayName}, ${monthName} ${dayNum}, ${year}`;
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #2596be 100%)',
        color: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
      }}
    >
      <Clock size={48} style={{ flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '1px' }}>
          {formatTime(currentTime)}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>
          {formatDate(currentTime)}
        </div>
      </div>
    </div>
  );
};

export default LiveClock;
