import React from 'react';
import Header from '../Header';

const AppShell = ({ currentMode, onBackHome, children }) => {
  return (
    <div className="app-container">
      <Header currentMode={currentMode} handleBackToHome={onBackHome} />
      <main className="main-content">{children}</main>
    </div>
  );
};

export default AppShell;

