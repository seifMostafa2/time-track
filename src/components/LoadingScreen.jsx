import React from 'react';

import { Clock } from 'lucide-react';
import { styles } from '../styles/styles';

const LoadingScreen = () => {
  return (
    <div style={styles.loginContainer}>
      <div style={styles.loading}>
        <Clock size={48} color="#667eea" />
        <p>Loading</p>
      </div>
    </div>
  );
};

export default LoadingScreen;