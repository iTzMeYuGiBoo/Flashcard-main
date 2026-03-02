import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ModelRouter } from './modelRouter.js';
import { learnAgent } from './agents/learnAgent.js';
import { quizAgent } from './agents/quizAgent.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const modelRouter = new ModelRouter();

/**
 * Temporary direct Gemini-backed flashcard generator.
 * This will be replaced by LearnAgent + ModelRouter in a later step.
 */
async function generateFlashcardsWithGemini({ topic, count }) {
  const userPrompt =
    `Create ${count} flash cards about \"${topic}\".\n` +
    `Return ONLY a JSON array of objects with fields: question, answer, explanation.`;

  const rawText = await modelRouter.callModel({
    provider: "gemini",
    model: "models/gemini-2.5-flash",
    userPrompt,
    maxTokens: 800,
    temperature: 0.4,
  });

  const cleaned = rawText
    .replace(/^```(?:json)?\n/, "")
    .replace(/\n```$/, "")
    .trim();

  if (!cleaned.startsWith("[")) {
    const error = {
      error: "Invalid or unknown topic. Please enter a valid subject.",
      message: rawText,
    };
    const err = new Error(error.error);
    err.details = error;
    throw err;
  }

  const flashcards = JSON.parse(cleaned);

  return flashcards.map((card, index) => ({
    ...card,
    id: `card-${index + 1}`,
  }));
}

/**
 * Temporary direct Gemini-backed quiz generator.
 * This will be replaced by QuizAgent + ModelRouter in a later step.
 */
async function generateQuizWithGemini({ topic, cardCount, difficulty, questionTypes }) {
  const userPrompt =
    `Create ${cardCount} quiz questions about \"${topic}\" with difficulty ${difficulty}.\n` +
    `Question types: ${questionTypes.join(", ")}.\n` +
    `Return ONLY a JSON array of objects with fields: type, question, correctAnswer, options (if any), explanation.`;

  const rawText = await modelRouter.callModel({
    provider: "gemini",
    model: "models/gemini-2.5-flash",
    userPrompt,
    maxTokens: 1200,
    temperature: 0.5,
  });

  const cleaned = rawText
    .replace(/^```(?:json)?\n/, "")
    .replace(/\n```$/, "")
    .trim();

  if (!cleaned.startsWith("[")) {
    const error = {
      error: "Invalid or unknown topic. Please enter a valid subject.",
      message: rawText,
    };
    const err = new Error(error.error);
    err.details = error;
    throw err;
  }

  const questions = JSON.parse(cleaned);

  return questions.map((card, index) => ({
    ...card,
    id: `card-${index + 1}`,
  }));
}

// New, structured endpoints (to be used by the upgraded frontend)
app.post("/api/flashcards/generate", async (req, res) => {
  const {
    topic,
    count,
    difficulty,
    expertiseLevel,
    model = "gemini",
    agentType = "balanced",
  } = req.body;

  if (!topic || topic.trim().length < 3) {
    return res.status(400).json({
      error: "Please enter a valid topic with at least 3 characters.",
    });
  }

  const safeCount = Math.max(1, Math.min(Number(count) || 10, 30));

  try {
    const cards = await learnAgent({
      topic,
      count: safeCount,
      expertiseLevel,
      model,
      agentType,
    });
    res.json(cards);
  } catch (err) {
    console.error("Failed to generate flashcards:", err.message || err);
    if (err.details) {
      return res.status(400).json(err.details);
    }
    res.status(500).json({ error: "Failed to generate flash cards" });
  }
});

app.post("/api/quiz/generate", async (req, res) => {
  const {
    topic,
    cardCount,
    difficulty,
    questionTypes = [],
    expertiseLevel,
    model = "gemini",
    agentType = "balanced",
  } = req.body;

  if (!topic || topic.trim().length < 3) {
    return res.status(400).json({
      error: "Please enter a valid topic with at least 3 characters.",
    });
  }

  const safeCount = Math.max(1, Math.min(Number(cardCount) || 10, 30));
  const safeTypes = Array.isArray(questionTypes) ? questionTypes : [];

  try {
    const questions = await quizAgent({
      topic,
      cardCount: safeCount,
      difficulty,
      questionTypes: safeTypes,
      expertiseLevel,
      model,
      agentType,
    });
    res.json(questions);
  } catch (err) {
    console.error("Failed to generate quiz questions:", err.message || err);
    if (err.details) {
      return res.status(400).json(err.details);
    }
    res.status(500).json({ error: "Failed to generate quiz questions" });
  }
});

// Backwards-compatible endpoints for current frontend utilities
app.post("/api/generate-flashcards", async (req, res) => {
  const { topic, count } = req.body;
  return learnAgent({
    topic,
    count,
  })
    .then((cards) => res.json(cards))
    .catch((err) => {
      console.error("Failed to generate flashcards:", err.message || err);
      if (err.details) {
        return res.status(400).json(err.details);
      }
      res.status(500).json({ error: "Failed to generate flash cards" });
    });
});

app.post("/api/generate-quiz", async (req, res) => {
  const { topic, cardCount, difficulty, questionTypes } = req.body;
  return quizAgent({
    topic,
    cardCount,
    difficulty,
    questionTypes: Array.isArray(questionTypes) ? questionTypes : [],
  })
    .then((questions) => res.json(questions))
    .catch((err) => {
      console.error("Failed to generate quiz questions:", err.message || err);
      if (err.details) {
        return res.status(400).json(err.details);
      }
      res.status(500).json({ error: "Failed to generate quiz questions" });
    });
});

// Simple analytics endpoint – aggregates quiz performance server-side.
app.post("/api/quiz/analyze", (req, res) => {
  const { questions = [], answers = {}, config = {} } = req.body || {};

  const total = questions.length;
  let correct = 0;

  const byDifficulty = {};

  function isCorrect(question, userAnswer) {
    if (Array.isArray(question.correctAnswer)) {
      return (
        Array.isArray(userAnswer) &&
        userAnswer.length === question.correctAnswer.length &&
        userAnswer.every((ans) => question.correctAnswer.includes(ans))
      );
    }
    return userAnswer === question.correctAnswer;
  }

  questions.forEach((q, index) => {
    const userAnswer = answers[index];
    const ok = isCorrect(q, userAnswer);
    if (ok) correct += 1;

    const diffKey = q.difficulty || config.difficulty || "Unknown";
    if (!byDifficulty[diffKey]) {
      byDifficulty[diffKey] = { correct: 0, total: 0 };
    }
    byDifficulty[diffKey].total += 1;
    if (ok) byDifficulty[diffKey].correct += 1;
  });

  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  res.json({
    score: { correct, total, percentage },
    breakdown: {
      byDifficulty,
    },
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// app.post('/api/generate-quiz', async (req, res) => {
//   const { topic, cardCount, difficulty, questionTypes } = req.body;
//   try {
//     const prompt =
//       `You are a helpful assistant that generates quiz questions in JSON format. ` +
//       `Create ${cardCount} quiz questions about "${topic}" with difficulty ${difficulty}. ` +
//       `Question types: ${questionTypes.join(', ')}. ` +
//       `Respond with an array of objects containing type, question, correctAnswer, options (if any) and explanation.`;

//     const text = await callGoogle([{ role: 'user', parts: [{ text: prompt }] }]);
//     const questions = JSON.parse(text.trim());
//     res.json(questions);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to generate quiz questions' });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });
