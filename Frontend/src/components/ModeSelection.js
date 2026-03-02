import React from 'react';
import { BookOpen, Brain, ArrowRight } from 'lucide-react';

const ModeSelection = ({ onModeSelect }) => {
  return (
    <div className="mode-selection">
      <div className="hero">
        <h2>Learn fast. Quiz smarter.</h2>
        <p>
          Pick a mode to get started. You can choose model and expertise level
          in the next step.
        </p>
      </div>

      <div className="mode-cards">
        <div className="mode-card learn">
          <div className="card-top learn">
            <div className="card-header">
              <BookOpen className="icon" />
              <h3>Learn Mode</h3>
            </div>
            <p className="card-subtitle">Focused flashcards with clean explanations</p>
          </div>
          <div className="card-body">
            <div className="bullet">Generate cards from any topic</div>
            <div className="bullet">Swipe through concise Q/A pairs</div>
            <div className="bullet">Reset and explore new topics fast</div>
            <button onClick={() => onModeSelect('learn')} className="btn-primary">
              <span>Start Learning</span>
              <ArrowRight className="icon" />
            </button>
          </div>
        </div>

        <div className="mode-card quiz">
          <div className="card-top quiz">
            <div className="card-header">
              <Brain className="icon" />
              <h3>Quiz Mode</h3>
            </div>
            <p className="card-subtitle">Quick checks with instant feedback</p>
          </div>
          <div className="card-body">
            <div className="bullet">Multiple question styles</div>
            <div className="bullet">Adjust difficulty on the fly</div>
            <div className="bullet">Review answers with explanations</div>
            <button onClick={() => onModeSelect('quiz')} className="btn-purple">
              <span>Start Quiz</span>
              <ArrowRight className="icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelection;
