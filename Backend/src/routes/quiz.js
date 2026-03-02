import express from 'express';
import { quizAgent } from '../agents/quizAgent.js';

export const quizRouter = express.Router();

quizRouter.post('/generate', async (req, res) => {
  const {
    topic,
    cardCount,
    difficulty,
    questionTypes = [],
    expertiseLevel,
    model = 'gemini',
    agentType = 'balanced',
  } = req.body;

  if (!topic || topic.trim().length < 3) {
    return res.status(400).json({
      error: 'Please enter a valid topic with at least 3 characters.',
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
    console.error('Failed to generate quiz questions:', err.message || err);
    if (err.details) {
      return res.status(400).json(err.details);
    }
    res.status(500).json({ error: 'Failed to generate quiz questions' });
  }
});
