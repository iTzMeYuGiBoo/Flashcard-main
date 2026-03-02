import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import FlashCard from './FlashCard';
import { generateFlashCards } from '../utils/flashCardGenerator.js';

const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash',      name: 'Gemini 2.5 Flash',      desc: 'Latest & fastest',   free: '500 req/day' },
  { id: 'gemini-2.5-pro',        name: 'Gemini 2.5 Pro',        desc: 'Complex reasoning',  free: '25 req/day' },
  { id: 'gemini-2.0-flash',      name: 'Gemini 2.0 Flash',      desc: 'Multimodal tasks',   free: '1500 req/day' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', desc: 'Cost-efficient',     free: '1500 req/day' },
];

const LearnMode = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [cardCount, setCardCount] = useState(10);
  const [flashCards, setFlashCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [expertiseLevel, setExpertiseLevel] = useState('intermediate');
  const agentType = 'balanced';

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    try {
      const cards = await generateFlashCards(topic, cardCount, {
        model: selectedModel,
        geminiModel: selectedModel === 'gemini' ? geminiModel : undefined,
        expertiseLevel,
        agentType,
      });
      setFlashCards(cards);
      setCurrentCardIndex(0);
      setHasGenerated(true);
    } catch (error) {
      console.error('Error generating flash cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentCardIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentCardIndex((prev) => Math.min(flashCards.length - 1, prev + 1));
  };

  const handleReset = () => {
    setTopic('');
    setCardCount(10);
    setFlashCards([]);
    setCurrentCardIndex(0);
    setHasGenerated(false);
  };

  const handleGenerateQuiz = () => {
    navigate('/quiz', {
      state: {
        topic,
        expertiseLevel,
        model: selectedModel,
        geminiModel,
      },
    });
  };

  if (!hasGenerated) {
    return (
      <div className="learn-setup">
        <div className="card">
          <div style={{ marginBottom: '32px' }}>
            <div className="card-title">Learn Mode</div>
            <p className="card-subtitle">
              Set your preferences and generate focused flashcards in seconds.
            </p>
          </div>

          <div className="form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-field" style={{ marginBottom:'0px' }}>
              <div style={{ marginBottom:"8px" }}>
                <label style={{fontWeight:'500', fontSize:'0.875rem'}}>Topic</label>
              </div>
              <div className="input-icon">
                <Search className="icon" />
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter the topic you want to study..."
                />
              </div>
            </div>

            <div className="form-field" style={{ marginTop:'24px', marginBottom:'0px' }}>
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

            <div className="form-field" style={{ marginTop: '16px', marginBottom: '0px' }}>
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
              <div className="form-field" style={{ marginTop: '8px', marginBottom: '0px' }}>
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

            <div className="form-field" style={{ marginTop: '4px', marginBottom: '0px' }}>
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

            <button
              onClick={handleGenerate}
              disabled={!topic.trim() || isLoading}
              className="btn-primary"
              style={{marginTop:'24px'}}
            >
              {isLoading ? (
                <div className="spinner" />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
                  <Search className="icon" />
                  <span>Generate Flash Cards</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="learn-mode">
      <div className="card header" style={{ marginBottom:'24px' }}>
        <div className="header-info">
          <h2>Learn Mode: {topic}</h2>
          <p style={{margin:0}}>Card {currentCardIndex + 1} of {flashCards.length}</p>
        </div>
        <button onClick={handleReset} className="btn-text">
          <RotateCcw className="icon" />
          <span>New Topic</span>
        </button>
      </div>

      <div className="flashcard-wrapper">
        <FlashCard
          key={currentCardIndex}
          data={flashCards[currentCardIndex]}
          mode="learn"
        />
      </div>

      <div className="pager">
        <button onClick={goToPrevious} disabled={currentCardIndex === 0} className="btn-nav">
          <ChevronLeft className="icon" />
          <span>Previous</span>
        </button>

        <div className="pager-dots">
          {flashCards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCardIndex(index)}
              className={index === currentCardIndex ? 'dot active' : 'dot'}
            />
          ))}
        </div>

        <button
          onClick={goToNext}
          disabled={currentCardIndex === flashCards.length - 1}
          className="btn-nav"
        >
          <span>Next</span>
          <ChevronRight className="icon" />
        </button>
      </div>

      {currentCardIndex === flashCards.length - 1 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div>
              <div className="card-title" style={{ marginBottom: '4px' }}>Ready for a quiz?</div>
              <p className="card-subtitle" style={{ margin: 0 }}>
                We can generate a quiz on this same topic next.
              </p>
            </div>
            <button onClick={handleGenerateQuiz} className="btn-primary">
              Generate Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnMode;
