import React, { useState } from 'react';
import { Search } from 'lucide-react';

const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash',      name: 'Gemini 2.5 Flash',      desc: 'Latest & fastest',   free: '500 req/day' },
  { id: 'gemini-2.5-pro',        name: 'Gemini 2.5 Pro',        desc: 'Complex reasoning',  free: '25 req/day' },
  { id: 'gemini-2.0-flash',      name: 'Gemini 2.0 Flash',      desc: 'Multimodal tasks',   free: '1500 req/day' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', desc: 'Cost-efficient',     free: '1500 req/day' },
];

const QuizSetup = ({
  onStartQuiz,
  initialTopic,
  initialExpertiseLevel,
  initialModel,
  initialGeminiModel,
}) => {
  const [topic, setTopic] = useState(initialTopic || '');
  const [cardCount, setCardCount] = useState(10);
  const [questionTypes, setQuestionTypes] = useState(['True/False', 'Single Select', 'Yes/No']);
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(initialModel || 'gemini');
  const [geminiModel, setGeminiModel] = useState(initialGeminiModel || 'gemini-2.5-flash');
  const [expertiseLevel, setExpertiseLevel] = useState(initialExpertiseLevel || 'intermediate');
  const agentType = 'balanced';

  const handleSubmit = async () => {
    if (!topic.trim() || questionTypes.length === 0) return;
    setIsLoading(true);

    const config = {
      topic,
      cardCount,
      questionTypes: allowMultipleAnswers ? [...questionTypes, 'Multi-Select'] : questionTypes,
      allowMultipleAnswers,
      model: selectedModel,
      geminiModel: selectedModel === 'gemini' ? geminiModel : undefined,
      expertiseLevel,
      agentType,
    };

    try {
      await onStartQuiz(config);
    } catch (error) {
      console.error('Error starting quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="quiz-setup">
      <div className="card">
        <div className="setup-header">
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.875rem', marginBottom: '16px' }}>
            Quiz Mode Setup
          </h2>
          <p style={{ margin: 0 }}>Ready to challenge yourself? Configure your quiz settings below</p>
        </div>

        <div className="form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-field">
            <div style={{ marginBottom:"8px" }}>
                <label style={{fontWeight:'500', fontSize:'0.875rem'}}>Topic</label>
            </div>
            <div className="input-icon">
              <Search className="icon" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter the topic for your quiz..."
              />
              </div>
          </div>

          <div className="form-field" style={{ marginTop:'24px' }}>
              <div style={{ marginBottom:'8px', display: 'flex', flexDirection: 'column' }}>
                <label style={{fontWeight:'500', fontSize:'0.875rem'}}>Number of Flash Cards (1-30)</label>
              </div>
              <div className="input-icon">
                <input
                type="number"
                min="1"
                max="30"
                value={cardCount}
                onChange={(e) =>
                  setCardCount(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))
                }
              />
              </div>
            </div>

          <div className="form-field" style={{ marginTop: '16px' }}>
            <div className="section-label">Model</div>
            <div className="choice-group">
              <button
                type="button"
                className={`choice-btn ${selectedModel === 'gemini' ? 'active' : ''}`}
                onClick={() => setSelectedModel('gemini')}
              >
                Gemini
              </button>
              {/* OpenAI/ChatGPT - Coming Soon */}
              {/* <button
                type="button"
                className={`choice-btn ${selectedModel === 'openai' ? 'active' : ''}`}
                onClick={() => setSelectedModel('openai')}
              >
                ChatGPT
              </button> */}
            </div>
          </div>

          {selectedModel === 'gemini' && (
            <div className="form-field" style={{ marginTop: '8px' }}>
              <div className="section-label">Gemini Model</div>
              <div className="choice-group" style={{ flexDirection: 'column', gap: '6px' }}>
                {GEMINI_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`choice-btn ${geminiModel === m.id ? 'active' : ''}`}
                    onClick={() => setGeminiModel(m.id)}
                    style={{ textAlign: 'left', justifyContent: 'space-between', display: 'flex', width: '100%' }}
                  >
                    <span>{m.name}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{m.free}</span>
                  </button>
                ))}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.75rem', opacity: 0.6 }}>
                Auto-fallback: if the selected model's quota is exhausted, the next available model is tried automatically.
              </p>
            </div>
          )}

          <div className="form-field" style={{ marginTop: '4px' }}>
            <div className="section-label">Expertise</div>
            <div className="choice-group">
              <button
                type="button"
                className={`choice-btn ${expertiseLevel === 'beginner' ? 'active' : ''}`}
                onClick={() => setExpertiseLevel('beginner')}
              >
                Beginner
              </button>
              <button
                type="button"
                className={`choice-btn ${expertiseLevel === 'intermediate' ? 'active' : ''}`}
                onClick={() => setExpertiseLevel('intermediate')}
              >
                Intermediate
              </button>
              <button
                type="button"
                className={`choice-btn ${expertiseLevel === 'advanced' ? 'active' : ''}`}
                onClick={() => setExpertiseLevel('advanced')}
              >
                Advanced
              </button>
            </div>
          </div>

          <div className="form-field multiple-checkbox">
            <div className="question-types">
              <div className="checkbox-option multiple">
                <input
                  type="checkbox"
                  checked={allowMultipleAnswers}
                  onChange={(e) => setAllowMultipleAnswers(e.target.checked)}
                />
                <span className="label">Allow Multiple Answers (adds Multi-Select questions)</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!topic.trim() || questionTypes.length ===0 || isLoading}
            className="btn-primary"
            style={{marginTop:'24px'}}
          >
            {isLoading ? (
              <div className="spinner" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
                <span>Start Quiz</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizSetup;
