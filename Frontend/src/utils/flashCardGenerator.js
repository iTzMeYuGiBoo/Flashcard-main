import { toast } from 'react-toastify';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// Helper function to parse API errors and return user-friendly messages
const parseErrorMessage = (status, errorData) => {
  const rawMessage = errorData?.error || '';
  
  if (status === 429 || rawMessage.includes('USAGE LIMIT REACHED')) {
    return '⏱️ API quota exceeded. Your API key has reached its request limit. Please try again later or upgrade your plan.';
  }
  
  if (status === 401 || rawMessage.includes('INVALID API KEY') || rawMessage.includes('Incorrect API key')) {
    return '🔑 Invalid API Key. Please check your API key configuration and try again.';
  }
  
  if (rawMessage.includes('not configured')) {
    return '⚙️ API Key not configured. Please set up your API key in the backend environment file.';
  }
  
  if (rawMessage.includes('Quota')) {
    return '⏱️ Quota exceeded for this API. Please retry in a moment or check your API account.';
  }
  
  if (rawMessage.includes('unauthorized') || rawMessage.includes('forbidden')) {
    return '🚫 Access denied. Your API key does not have permission for this action.';
  }
  
  if (status === 500 || !rawMessage) {
    return '❌ Something went wrong. Please check the backend logs for details.';
  }
  
  return `⚠️ Error: ${rawMessage}`;
};

export const generateFlashCards = async (topic, count, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        count,
        model: options.model,
        geminiModel: options.geminiModel,
        expertiseLevel: options.expertiseLevel,
        agentType: options.agentType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const userFriendlyMessage = parseErrorMessage(response.status, errorData);
      toast.error(userFriendlyMessage);
      throw new Error(userFriendlyMessage);
    }

    const cards = await response.json();

    return cards.map((card, index) => ({
      ...card,
      id: `card-${index + 1}`,
    }));
  } catch (err) {
    console.error('Flashcard generation failed:', err);
    throw err;
  }
};
