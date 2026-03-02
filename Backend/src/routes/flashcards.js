import express from 'express';
import { learnAgent } from '../agents/learnAgent.js';

export const flashcardsRouter = express.Router();

flashcardsRouter.post('/generate', async (req, res) => {
  const {
    topic,
    count,
    expertiseLevel,
    model = 'gemini',
    agentType = 'balanced',
  } = req.body;

  if (!topic || topic.trim().length < 3) {
    return res.status(400).json({
      error: 'Please enter a valid topic with at least 3 characters.',
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
    console.error('Failed to generate flashcards:', err.message || err);
    if (err.details) {
      return res.status(400).json(err.details);
    }
    res.status(500).json({ error: 'Failed to generate flash cards' });
  }
});
