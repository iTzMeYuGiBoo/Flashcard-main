import { ModelRouter } from '../modelRouter.js';

const routerSingleton = new ModelRouter();

export async function quizAgent({
  topic,
  cardCount,
  difficulty = 'Medium',
  questionTypes = [],
  expertiseLevel = 'intermediate',
  model = 'gemini',
  agentType = 'balanced',
}) {
  const safeCount = Math.max(1, Math.min(Number(cardCount) || 10, 30));
  const typesList =
    questionTypes && questionTypes.length ? questionTypes.join(', ') : 'True/False, Yes/No, Single Select';

  const systemPrompt =
    'You are an exam designer that creates clear, self-contained quiz questions with explanations.\n' +
    `User expertise level: ${expertiseLevel}. Style: ${agentType}.\n` +
    'Output MUST be a pure JSON array (no markdown), each item with fields:\n' +
    '{ "type", "question", "correctAnswer", "options" (array or null), "explanation" }.';

  const userPrompt =
    `Create ${safeCount} quiz questions about \"${topic}\" with difficulty ${difficulty}.\n` +
    `Allowed question types: ${typesList}.\n` +
    'Make questions unambiguous and explanations actionable.';

  const rawText = await routerSingleton.callModel({
    provider: model === 'gemini' ? 'gemini' : 'gemini',
    model: 'models/gemini-2.5-flash',
    systemPrompt,
    userPrompt,
    maxTokens: 1400,
    temperature: 0.5,
  });

  const cleaned = rawText
    .replace(/^```(?:json)?\n/, '')
    .replace(/\n```$/, '')
    .trim();

  if (!cleaned.startsWith('[')) {
    const error = {
      error: 'Model returned an unexpected format while generating quiz questions.',
      message: rawText,
    };
    const err = new Error(error.error);
    err.details = error;
    throw err;
  }

  const questions = JSON.parse(cleaned);

  return questions.map((q, index) => ({
    id: q.id || `q-${index + 1}`,
    type: q.type,
    question: q.question,
    correctAnswer: q.correctAnswer,
    options: q.options || null,
    explanation: q.explanation,
  }));
}

