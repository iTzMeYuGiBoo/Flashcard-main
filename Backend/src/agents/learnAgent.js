import { ModelRouter } from '../model/modelRouter.js';

const routerSingleton = new ModelRouter();

// Maps provider keys to default model IDs
const DEFAULT_MODELS = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
};

export async function learnAgent({
  topic,
  count,
  expertiseLevel = 'intermediate',
  model = 'gemini',
  geminiModel,       // optional: specific Gemini model ID
  agentType = 'balanced',
}) {
  const safeCount = Math.max(1, Math.min(Number(count) || 10, 30));
  const provider = model === 'openai' ? 'openai' : 'gemini';
  const resolvedModel = provider === 'gemini'
    ? (geminiModel || DEFAULT_MODELS.gemini)
    : DEFAULT_MODELS.openai;

  const systemPrompt =
    'Create concise flashcards. Output only JSON array: { "question", "answer", "explanation" }.\n' +
    `Expertise: ${expertiseLevel}. Style: ${agentType}.\n` +
    'Explanations must be one short sentence.';

  const userPrompt = `Make ${safeCount} flashcards about "${topic}".`;

  const rawText = await routerSingleton.callModel({
    provider,
    model: resolvedModel,
    systemPrompt,
    userPrompt,
    maxTokens: 480,
    temperature: 0.3,
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

