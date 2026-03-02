import React from 'react';

const FlashCard = ({ data }) => {

  return (
    <div className="flash-card">
      <div className="flash-card-body">
        <div className="flash-card-content">
          <div style={{textAlign: 'center'}}>
            <h3 className="question-label">QUESTION</h3>
            <p className="question-text">{data.question}</p>
          </div>

          <div className="answer-section">
            <h3 className="answer-label">ANSWER</h3>
            <div className={`answer-text visible`}>
              <p>{data.answer}</p>
              {data.explanation && (
                <div className="explanation">
                  <p>
                    <strong>Explanation:</strong> {data.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashCard;
