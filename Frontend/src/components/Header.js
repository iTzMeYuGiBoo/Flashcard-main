import React from 'react';
import { BookOpen, Home } from 'lucide-react';

const Header = ({ currentMode, handleBackToHome }) => (
  <header className="app-header">
    <div className="header-container">
      <div className="header-inner">
        <div className="header-title">
          <div className="header-logo">
            <BookOpen className="icon" />
          </div>
          <h1 className="app-title">FlashCard Pro</h1>
        </div>
        {currentMode !== 'selection' && (
          <button onClick={handleBackToHome} className="home-button">
            <Home className="icon" />
            <span>Home</span>
          </button>
        )}
      </div>
    </div>
  </header>
);

export default Header;
