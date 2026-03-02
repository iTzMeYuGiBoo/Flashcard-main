import React from 'react';
import ModeSelection from '../components/ModeSelection';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  const handleModeSelect = (mode) => {
    if (mode === 'learn') {
      navigate('/learn');
    } else if (mode === 'quiz') {
      navigate('/quiz/setup');
    }
  };

  return (
    <ModeSelection
      onModeSelect={handleModeSelect}
    />
  );
};

export default HomePage;

