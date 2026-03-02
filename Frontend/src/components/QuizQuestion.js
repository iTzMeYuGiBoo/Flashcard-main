import React from 'react';

const QuizQuestion = ({ question, answer, onAnswerChange }) => {
  const renderQuestionContent = () => {
    switch (question.type) {
      case 'True/False':
        return (
          <div className="options">
            {['True', 'False'].map((option) => (
              <label key={option} className="option-label">
                <input
                  type="radio"
                  name="trueFalse"
                  value={option}
                  checked={answer === option}
                  onChange={(e) => onAnswerChange(e.target.value)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      case 'Yes/No':
        return (
          <div className="options">
            {['Yes', 'No'].map((option) => (
              <label key={option} className="option-label">
                <input
                  type="radio"
                  name="yesNo"
                  value={option}
                  checked={answer === option}
                  onChange={(e) => onAnswerChange(e.target.value)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      case 'Single Select':
        return (
          <div className="options">
            {question.options?.map((option, index) => (
              <label key={index} className="option-label">
                <input
                  type="radio"
                  name="singleSelect"
                  value={option}
                  checked={answer === option}
                  onChange={(e) => onAnswerChange(e.target.value)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      case 'Multi-Select':
        return (
          <div className="options">
            {question.options?.map((option, index) => (
              <label key={index} className="option-label">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(answer) && answer.includes(option)}
                  onChange={(e) => {
                    const currentAnswers = Array.isArray(answer) ? answer : [];
                    if (e.target.checked) {
                      onAnswerChange([...currentAnswers, option]);
                    } else {
                      onAnswerChange(currentAnswers.filter((a) => a !== option));
                    }
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      default:
        return <div>Unknown question type</div>;
    }
  };

  return (
    <div className="quiz-question">
      <div className="question-header">
        <h3 className="question-text">{question.question}</h3>
      </div>
      <div className="answer-options">{renderQuestionContent()}</div>
      {question.type === 'Multi-Select' && (
        <div className="multi-note">
          <p>
            <strong>Note:</strong> You can select multiple answers for this question.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizQuestion;
