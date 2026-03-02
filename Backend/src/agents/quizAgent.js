import { ModelRouter } from '../model/modelRouter.js';

const routerSingleton = new ModelRouter();

// Maps provider keys to default model IDs
const DEFAULT_MODELS = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
};

export async function quizAgent({
  topic,
  cardCount,
  difficulty = 'Medium',
  questionTypes = [],
  expertiseLevel = 'intermediate',
  model = 'gemini',
  geminiModel,       // optional: specific Gemini model ID
  agentType = 'balanced',
}) {
  const safeCount = Math.max(1, Math.min(Number(cardCount) || 10, 30));
  const provider = model === 'openai' ? 'openai' : 'gemini';
  const resolvedModel = provider === 'gemini'
    ? (geminiModel || DEFAULT_MODELS.gemini)
    : DEFAULT_MODELS.openai;

  const typesList =
    questionTypes && questionTypes.length ? questionTypes.join(', ') : 'True/False, Yes/No, Single Select';

  const systemPrompt =
    'Create concise quiz questions. Output only JSON array with fields: ' +
    '{ "type", "question", "correctAnswer", "options", "explanation" }.\n' +
    `Expertise: ${expertiseLevel}. Style: ${agentType}.\n` +
    'Explanations must be one short sentence.';

  const userPrompt =
    `Make ${safeCount} questions about "${topic}". Difficulty: ${difficulty}.\n` +
    `Allowed types: ${typesList}.`;

  const rawText = await routerSingleton.callModel({
    provider,
    model: resolvedModel,
    systemPrompt,
    userPrompt,
    maxTokens: 800,
    temperature: 0.35,
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

