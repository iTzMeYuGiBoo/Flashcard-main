import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import AppShell from './components/Layout/AppShell';
import HomePage from './pages/HomePage';
import LearnPage from './pages/LearnPage';
import QuizTakingPage from './pages/QuizTakingPage';

const AppInner = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentMode =
    location.pathname.startsWith('/learn')
      ? 'learn'
      : location.pathname.startsWith('/quiz')
      ? 'quiz'
      : 'selection';

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <AppShell currentMode={currentMode} onBackHome={handleBackToHome}>
      <Routes>
        <Route
          path="/"
          element={<HomePage />}
        />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/quiz/*" element={<QuizTakingPage />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnHover
      />
    </AppShell>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;
