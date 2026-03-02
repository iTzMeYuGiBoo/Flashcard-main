import React, { useState } from 'react';
import { CheckCircle, XCircle, Eye, RotateCcw, Trophy, Target } from 'lucide-react';

const QuizResults = ({ questions, answers, config, onRetakeQuiz }) => {
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [view, setView] = useState('summary'); // 'summary' | 'details'

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      if (Array.isArray(question.correctAnswer)) {
        if (
          Array.isArray(userAnswer) &&
          userAnswer.length === question.correctAnswer.length &&
          userAnswer.every((ans) => question.correctAnswer.includes(ans))
        ) {
          correct++;
        }
      } else {
        if (userAnswer === question.correctAnswer) {
          correct++;
        }
      }
    });
    return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) };
  };

  const isCorrect = (question, userAnswer) => {
    if (Array.isArray(question.correctAnswer)) {
      return (
        Array.isArray(userAnswer) &&
        userAnswer.length === question.correctAnswer.length &&
        userAnswer.every((ans) => question.correctAnswer.includes(ans))
      );
    }
    return userAnswer === question.correctAnswer;
  };

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const score = calculateScore();

  const getScoreClass = () => {
    if (score.percentage >= 80) return 'good';
    if (score.percentage >= 60) return 'ok';
    return 'bad';
  };

  return (
    <div className="quiz-results">
      <div className={`score-summary ${getScoreClass()}`}>
        <div className="summary-content">
          <Trophy className="icon large" />
          <h2>Quiz Complete!</h2>
          <div className="percentage">{score.percentage}%</div>
          <p>You scored {score.correct} out of {score.total} questions correctly</p>
          <div className="summary-info">
            <div className="topic">
              <Target className="icon" />
              <span>Topic: {config.topic}</span>
            </div>
            <div className="difficulty">Difficulty: {config.difficulty}</div>
          </div>
          <div style={{ margin: '1rem 0', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className={`btn-nav ${view === 'summary' ? 'active' : ''}`}
              onClick={() => setView('summary')}
            >
              Overview
            </button>
            <button
              type="button"
              className={`btn-nav ${view === 'details' ? 'active' : ''}`}
              onClick={() => setView('details')}
            >
              Question review
            </button>
          </div>
          <button onClick={onRetakeQuiz} className="btn-purple">
            <RotateCcw className="icon" />
            <span>Take Another Quiz</span>
          </button>
        </div>
      </div>

      {view === 'details' && (
        <div className="detailed-review">
          <h3>Detailed Review</h3>
          <div className="review-list">
            {questions.map((question, index) => {
              const userAnswer = answers[index];
              const correct = isCorrect(question, userAnswer);
              const isExpanded = expandedQuestions.has(index);
              return (
                <div key={index} className="review-item">
                  <div className="review-header">
                    {correct ? (
                      <CheckCircle className="icon success" />
                    ) : (
                      <XCircle className="icon error" />
                    )}
                    <div className="review-body">
                      <div className="review-title">
                        <span>Question {index + 1}</span>
                        <span className="type">{question.type}</span>
                      </div>
                      <p className="question-text">{question.question}</p>
                      <div className="answers">
                        <div>
                          <p className="label">Your Answer:</p>
                          <div className={correct ? 'answer correct' : 'answer wrong'}>
                            {Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer || 'No answer'}
                          </div>
                        </div>
                        {!correct && (
                          <div>
                            <p className="label">Correct Answer:</p>
                            <div className="answer correct">
                              {(() => {
                                    const { correctAnswer, type } = question;

                                    if (typeof correctAnswer === 'boolean') {
                                      if (type === 'Yes/No') return correctAnswer ? 'Yes' : 'No';
                                      return correctAnswer ? 'True' : 'False';
                                    }

                                    if (typeof correctAnswer === 'string') {
                                      const normalized = correctAnswer.toLowerCase();
                                      if (type === 'Yes/No') {
                                        if (normalized === 'yes') return 'Yes';
                                        if (normalized === 'no') return 'No';
                                      } else {
                                        if (normalized === 'true') return 'True';
                                        if (normalized === 'false') return 'False';
                                      }
                                      return correctAnswer;
                                    }

                                    if (Array.isArray(correctAnswer)) {
                                      return correctAnswer.join(', ');
                                    }

                                    return 'No answer';
                                })()}
                            </div>
                          </div>
                        )}
                      </div>
                      {question.explanation && (
                        <div className="explanation">
                          <button onClick={() => toggleExpanded(index)} className="toggle">
                            <Eye className="icon" />
                            <span>{isExpanded ? 'Hide' : 'View More'}</span>
                          </button>
                          {isExpanded && (
                            <div className="explanation-text">
                              <p><strong>Explanation:</strong> {question.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizResults;
