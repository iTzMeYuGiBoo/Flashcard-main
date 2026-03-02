import React, { useState } from 'react';
import { CheckCircle, XCircle, Eye, RotateCcw, Trophy, Target } from 'lucide-react';

const QuizResults = ({ results, config, onRetakeQuiz }) => {
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [view, setView] = useState('summary'); // 'summary' | 'details'

  if (!results) {
    return <div>Loading results...</div>;
  }

  const { score, correctCount, totalCount, results: questionResults } = results;

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const getScoreClass = () => {
    if (score >= 80) return 'good';
    if (score >= 60) return 'ok';
    return 'bad';
  };

  return (
    <div className="quiz-results">
      <div className={`score-summary ${getScoreClass()}`}>
        <div className="summary-content">
          <Trophy className="icon large" />
          <h2>Quiz Complete!</h2>
          <div className="percentage">{score}%</div>
          <p>You scored {correctCount} out of {totalCount} questions correctly</p>
          <div className="summary-info">
            <div className="topic">
              <Target className="icon" />
              <span>Topic: {config.topic}</span>
            </div>
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
            {questionResults.map((result, index) => {
              const isExpanded = expandedQuestions.has(index);
              return (
                <div key={index} className="review-item">
                  <div className="review-header">
                    {result.isCorrect ? (
                      <CheckCircle className="icon success" />
                    ) : (
                      <XCircle className="icon error" />
                    )}
                    <div className="review-body">
                      <div className="review-title">
                        <span>Question {index + 1}</span>
                        <span className="type">{result.type}</span>
                      </div>
                      <p className="question-text">{result.question}</p>
                      <div className="answers">
                        <div>
                          <p className="label">Your Answer:</p>
                          <div className={result.isCorrect ? 'answer correct' : 'answer wrong'}>
                            {Array.isArray(result.userAnswer) 
                              ? result.userAnswer.join(', ') 
                              : result.userAnswer || 'No answer'}
                          </div>
                        </div>
                        {!result.isCorrect && (
                          <div>
                            <p className="label">Correct Answer:</p>
                            <div className="answer correct">
                              {(() => {
                                const { correctAnswer, type } = result;

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
                      {result.explanation && (
                        <div className="explanation">
                          <button onClick={() => toggleExpanded(index)} className="toggle">
                            <Eye className="icon" />
                            <span>{isExpanded ? 'Hide' : 'View More'}</span>
                          </button>
                          {isExpanded && (
                            <div className="explanation-text">
                              <p><strong>Explanation:</strong> {result.explanation}</p>
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
