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

export const generateQuizQuestions = async (config) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...config,
        geminiModel: config.geminiModel,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const userFriendlyMessage = parseErrorMessage(response.status, errorData);
      toast.error(userFriendlyMessage);
      throw new Error(userFriendlyMessage);
    }

    const data = await response.json();

    // Backend now returns { quizId, questions }
    // Questions no longer contain answers or explanations
    return {
      quizId: data.quizId,
      questions: data.questions.map((card, index) => ({
        ...card,
        id: card.id || `card-${index + 1}`,
      })),
    };
  } catch (err) {
    console.error('Quiz generation failed:', err);
    throw err;
  }
};

export const submitQuizAnswers = async (quizId, answers) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quizId,
        answers,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const userFriendlyMessage = parseErrorMessage(response.status, errorData);
      toast.error(userFriendlyMessage);
      throw new Error(userFriendlyMessage);
    }

    const results = await response.json();
    return results;
  } catch (err) {
    console.error('Quiz submission failed:', err);
    throw err;
  }
};
