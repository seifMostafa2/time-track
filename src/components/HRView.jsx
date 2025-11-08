import { useState } from 'react';
import { Users, Mail, UserPlus } from 'lucide-react';
import { styles } from '../styles/styles';
import HRRejectionEmails from './HRRejectionEmails';
import UserManagement from './UserManagement';
import TabNavigation from './TabNavigation';
import LiveClock from './LiveClock';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';

const HRView = ({ currentUser, students, onLogout, onRefresh }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('rejection-emails');

  const tabs = [
    { id: 'rejection-emails', label: t.hr?.rejectionEmails || 'Absage-E-Mails', icon: <Mail size={18} /> },
  //  { id: 'users', label: t.hr?.userManagement || 'Benutzerverwaltung', icon: <UserPlus size={18} /> }
  ];

  return (
    <div style={styles.app}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={styles.navLeft}>
            <Users size={32} style={{marginRight: '12px'}} />
            <div>
              <h1 style={styles.navTitle}>{t.hr?.dashboard || 'HR Dashboard'}</h1>
              <p style={styles.navSubtitle}>
                {t.hr?.welcome || 'Willkommen'}, {currentUser?.name}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <LanguageToggle />
            <button
              onClick={onLogout}
              style={{...styles.button, background: '#5568d3'}}
            >
              {t.common?.logout || 'Logout'}
            </button>
          </div>
        </div>
      </nav>

      <div style={styles.container}>
        <LiveClock />

        <TabNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabs}
        />

        {activeTab === 'rejection-emails' && (
          <HRRejectionEmails />
        )}

        {activeTab === 'users' && (
          <UserManagement
            students={students}
            onRefresh={onRefresh}
          />
        )}
      </div>
    </div>
  );
};

export default HRView;