import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import QuizSetup from './QuizSetup';
import QuizQuestion from './QuizQuestion';
import QuizResults from './QuizResults';
import { generateQuizQuestions } from '../utils/quizGenerator.js';

const QuizMode = ({
  initialTopic,
  initialExpertiseLevel,
  initialModel,
  initialGeminiModel,
}) => {
  const [quizState, setQuizState] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizConfig, setQuizConfig] = useState(null);

  const handleStartQuiz = async (config) => {
    setQuizConfig(config);
    const generatedQuestions = await generateQuizQuestions(config);
    setQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setQuizState('taking');
  };

  const handleAnswerChange = (answer) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }));
  };

  const goToPrevious = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1));
  };

  const handleSubmitQuiz = () => {
    setQuizState('results');
  };

  const handleRetakeQuiz = () => {
    setQuizState('setup');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setQuizConfig(null);
  };

  const renderQuizState = () => {
    switch (quizState) {
      case 'setup':
        return (
          <QuizSetup
            onStartQuiz={handleStartQuiz}
            initialTopic={initialTopic}
            initialExpertiseLevel={initialExpertiseLevel}
            initialModel={initialModel}
            initialGeminiModel={initialGeminiModel}
          />
        );
      case 'taking': {
        const allAnswered = questions.every((_, index) => answers[index] !== undefined);
        return (
          <div className="quiz-taking">
            <div className="quiz-header" style={{ marginBottom:'24px' }}>
              <div className="header-info">
                <h2>Quiz: {quizConfig?.topic}</h2>
                <p style={{margin:0}}>Question {currentQuestionIndex + 1} of {questions.length}</p>
              </div>
              <div className="difficulty">Difficulty: {quizConfig?.difficulty}</div>
            </div>

            <div className="question-wrapper">
              <QuizQuestion
                question={questions[currentQuestionIndex]}
                answer={answers[currentQuestionIndex]}
                onAnswerChange={handleAnswerChange}
              />
            </div>

            <div className="quiz-nav">
              <button onClick={goToPrevious} disabled={currentQuestionIndex === 0} className="btn-nav">
                <ChevronLeft className="icon" />
                <span>Previous</span>
              </button>

              <div className="question-dots">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={
                      answers[index] !== undefined
                        ? 'dot answered'
                        : index === currentQuestionIndex
                        ? 'dot active'
                        : 'dot'
                    }
                  >
                    {answers[index] !== undefined ? <CheckCircle className="icon" /> : index + 1}
                  </button>
                ))}
              </div>

              {allAnswered && (
                <button onClick={handleSubmitQuiz} className="btn-green">
                  Submit Quiz
                </button>
              )}

              <button
                onClick={goToNext}
                disabled={currentQuestionIndex === questions.length - 1}
                className="btn-nav"
              >
                <span>Next</span>
                <ChevronRight className="icon" />
              </button>
            </div>
          </div>
        );
      }
      case 'results':
        return (
          <QuizResults
            questions={questions}
            answers={answers}
            config={quizConfig}
            onRetakeQuiz={handleRetakeQuiz}
          />
        );
      default:
        return null;
    }
  };

  return renderQuizState();
};

export default QuizMode;
