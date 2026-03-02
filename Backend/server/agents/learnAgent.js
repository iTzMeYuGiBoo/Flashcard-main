import { ModelRouter } from '../modelRouter.js';

const routerSingleton = new ModelRouter();

export async function learnAgent({
  topic,
  count,
  expertiseLevel = 'intermediate',
  model = 'gemini',
  agentType = 'balanced',
}) {
  const safeCount = Math.max(1, Math.min(Number(count) || 10, 30));

  const systemPrompt =
    'You are a teaching assistant that generates concise, accurate flashcards.\n' +
    `User expertise level: ${expertiseLevel}.\n` +
    `Style: ${agentType}.\n` +
    'Output MUST be a pure JSON array, no prose or markdown. Each item: { "question", "answer", "explanation" }.';

  const userPrompt =
    `Create ${safeCount} high-quality flashcards about \"${topic}\".\n` +
    'Use clear, direct language and avoid unnecessary jargon unless level is advanced.';

  const rawText = await routerSingleton.callModel({
    provider: model === 'gemini' ? 'gemini' : 'gemini', // placeholder for future providers
    model: 'models/gemini-2.5-flash',
    systemPrompt,
    userPrompt,
    maxTokens: 900,
    temperature: 0.4,
  });

  const cleaned = rawText
    .replace(/^```(?:json)?\n/, '')
    .replace(/\n```$/, '')
    .trim();

  if (!cleaned.startsWith('[')) {
    const error = {
      error: 'Model returned an unexpected format while generating flashcards.',
      message: rawText,
    };
    const err = new Error(error.error);
    err.details = error;
    throw err;
  }

  const flashcards = JSON.parse(cleaned);

  return flashcards.map((card, index) => ({
    question: card.question,
    answer: card.answer,
    explanation: card.explanation,
    id: card.id || `card-${index + 1}`,
  }));
}

