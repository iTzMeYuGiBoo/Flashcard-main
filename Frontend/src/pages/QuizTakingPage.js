import React from 'react';
import { useLocation } from 'react-router-dom';
import QuizMode from '../components/QuizMode';

const QuizTakingPage = () => {
  const location = useLocation();
  const state = location.state || {};

  // QuizMode already encapsulates setup/taking/results; for now we reuse it directly.
  return (
    <QuizMode
      initialTopic={state.topic}
      initialExpertiseLevel={state.expertiseLevel}
      initialModel={state.model}
      initialGeminiModel={state.geminiModel}
    />
  );
};

export default QuizTakingPage;

