const TabNavigation = ({ activeTab, onTabChange, tabs }) => {
  const styles = {
    container: {
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '8px',
      borderRadius: '12px',
      marginBottom: '24px'
    },
    tabList: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    tab: {
      padding: '12px 24px',
      border: '2px solid transparent',
      background: 'transparent',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '500',
      color: '#ffffff',
      borderRadius: '8px',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    activeTab: {
      color: '#ffffff',
      border: '2px solid #2596BE',
      fontWeight: '600'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabList}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.activeTab : {})
            }}
            onMouseOver={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = '#ffffff';
              }
            }}
          >
            {tab.icon && tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;