import { useState } from 'react';
import { Users, Mail } from 'lucide-react';
import { styles } from '../styles/styles';
import HRRejectionEmails from './HRRejectionEmails';
import TabNavigation from './TabNavigation';
import LiveClock from './LiveClock';
import LanguageToggle from './LanguageToggle';

const HRView = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('rejection-emails');

  const tabs = [
    { id: 'rejection-emails', label: 'Absage-E-Mails', icon: <Mail size={18} /> }
  ];

  return (
    <div style={styles.app}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={styles.navLeft}>
            <Users size={32} style={{marginRight: '12px'}} />
            <div>
              <h1 style={styles.navTitle}>HR Dashboard</h1>
              <p style={styles.navSubtitle}>
                Willkommen, {currentUser?.name}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <LanguageToggle />
            <button
              onClick={onLogout}
              style={{...styles.button, background: '#5568d3'}}
            >
              Logout
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
      </div>
    </div>
  );
};

export default HRView;