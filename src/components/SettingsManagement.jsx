import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { styles } from '../styles/styles';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';

const SettingsManagement = ({ currentUser }) => {
  const { t } = useLanguage();

  const [settings, setSettings] = useState({
    lock_date_to_today: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) throw error;

      const settingsObj = {};
      data.forEach((s) => {
        settingsObj[s.setting_key] = s.setting_value === 'true';
      });

      setSettings((prev) => ({ ...prev, ...settingsObj }));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const handleSaveSetting = async (key, value) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({
          setting_value: value.toString(),
          updated_at: new Date().toISOString(),
          updated_by: currentUser.id,
        })
        .eq('setting_key', key);

      if (error) throw error;

      alert(t.settings?.saved || 'Einstellung erfolgreich gespeichert!');
      await fetchSettings();
    } catch (error) {
      console.error('Error saving setting:', error);
      alert(t.common?.errorSaving || 'Fehler beim Speichern');
    }
  };

  const handleToggle = (key) => {
    const newValue = !settings[key];
    setSettings({ ...settings, [key]: newValue });
    handleSaveSetting(key, newValue);
  };

  if (loading) {
    return <div style={styles.card}>{t.common?.loading || 'Einstellungen werden geladen...'}</div>;
  }

  const txt = {
    title: t.settings?.title || 'Anwendungseinstellungen',
    lockDateTitle: t.settings?.lockDateTitle || 'Datum auf Heute sperren',
    lockDateDesc:
      t.settings?.lockDateDescription ||
      'Wenn aktiviert, können Studenten nur für den aktuellen Tag Zeit erfassen. Wenn deaktiviert, können Studenten jedes Datum auswählen.',
    currentStatus: t.settings?.currentStatus || 'Aktueller Status:',
    onlyToday: t.settings?.studentsCanOnlyLogToday || 'Studenten können NUR für heute Zeit erfassen',
    anyDate: t.settings?.studentsCanLogAnyDate || 'Studenten können für JEDES Datum Zeit erfassen',
    tip: t.settings?.tip || '💡 Tipp:',
    tipMsg:
      t.settings?.tipMessage ||
      'Verwenden Sie "Datum auf Heute sperren" für Echtzeit-Erfassung. Deaktivieren Sie es, wenn Studenten historische Zeiteinträge oder verpasste Tage erfassen müssen.',
  };

  const locked = settings.lock_date_to_today;

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>
        <Settings size={20} />
        {txt.title}
      </h2>

      <div
        style={{
          background: '#f9fafb',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>{txt.lockDateTitle}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{txt.lockDateDesc}</p>
          </div>

          {/* Toggle */}
          <label
            style={{
              position: 'relative',
              display: 'inline-block',
              width: '60px',
              height: '34px',
              marginLeft: '20px',
              flexShrink: 0,
            }}
          >
            <input
              type="checkbox"
              checked={locked}
              onChange={() => handleToggle('lock_date_to_today')}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: locked ? '#667eea' : '#ccc',
                transition: '0.4s',
                borderRadius: '34px',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  height: '26px',
                  width: '26px',
                  left: locked ? '30px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '0.4s',
                  borderRadius: '50%',
                }}
              />
            </span>
          </label>
        </div>

        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            background: locked ? '#fef3c7' : '#d1fae5',
            border: `1px solid ${locked ? '#fde68a' : '#a7f3d0'}`,
            borderRadius: '8px',
            fontSize: '14px',
            color: locked ? '#92400e' : '#065f46',
          }}
        >
          <strong>{txt.currentStatus}</strong> {locked ? txt.onlyToday : txt.anyDate}
        </div>
      </div>
<div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', fontSize: '14px', color: '#1e40af' }}>
        <strong>{txt.tip}</strong> {txt.tipMsg}
      </div>
    </div>
  );
};

export default SettingsManagement;
