import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { flashcardsRouter } from './routes/flashcards.js';
import { quizRouter } from './routes/quiz.js';
import { learnAgent } from './agents/learnAgent.js';
import { quizAgent } from './agents/quizAgent.js';
import { getAvailableModels } from './model/modelRouter.js';
import {
  globalLimiter,
  generationLimiter,
  requestSizeLimit,
  validationMiddleware,
  getCorsOptions,
  sanitizeTopic,
} from './middleware/security.js';

const app = express();

// ── SECURITY MIDDLEWARE ──────────────────────────────────────────────────

// CORS: Restrict cross-origin requests to allowed origins (MUST be before helmet)
app.use(cors(getCorsOptions()));

// Helmet: Set security HTTP headers
app.use(helmet());

// Body parser with size limit to prevent DoS attacks
app.use(requestSizeLimit);

// Global rate limiter (100 req/15min per IP)
app.use(globalLimiter);

// Trust proxy (for accurate IP detection when behind reverse proxy)
app.set('trust proxy', 1);

// ── HEALTH CHECK ENDPOINT ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ── AVAILABLE models endpoint ────────────────────────────────────────────
app.get('/api/models', (req, res) => {
  res.json(getAvailableModels());
});

// New structured API
app.use('/api/flashcards', flashcardsRouter);
app.use('/api/quiz', quizRouter);

// Backwards-compatible legacy endpoints for existing frontend utilities
// Apply strict rate limiting (10 req/15min per IP) and validation
app.post(
  '/api/generate-flashcards',
  generationLimiter,
  validationMiddleware,
  async (req, res) => {
    const {
      topic,
      count,
      expertiseLevel,
      model = 'gemini',
      geminiModel,
      agentType = 'balanced',
    } = req.body;

    const safeCount = Math.max(1, Math.min(Number(count) || 10, 30));

    try {
      const cards = await learnAgent({
        topic,
        count: safeCount,
        expertiseLevel,
        model,
        geminiModel,
        agentType,
      });
      res.json(cards);
    } catch (err) {
      console.error('\n=== FLASHCARD GENERATION ERROR ===');
      console.error(
        'Error Type:',
        err.isRateLimited ? 'RATE_LIMITED' : err.isAuthError ? 'AUTH_ERROR' : 'UNKNOWN'
      );
      console.error('Message:', err.message || err);
      console.error('==================================\n');

      if (err.details) {
        return res.status(400).json(err.details);
      }
      if (
        err.isRateLimited ||
        err.message?.includes('USAGE LIMIT REACHED') ||
        err.message?.includes('All Gemini models failed')
      ) {
        return res.status(429).json({ error: err.message });
      }
      if (
        err.isAuthError ||
        err.message?.includes('INVALID API KEY') ||
        err.message?.includes('Incorrect API key')
      ) {
        return res.status(401).json({ error: err.message });
      }
      res.status(500).json({ error: err.message || 'Failed to generate flash cards' });
    }
  }
);

app.post(
  '/api/generate-quiz',
  generationLimiter,
  validationMiddleware,
  async (req, res) => {
    const {
      topic,
      questionCount,
      cardCount,
      difficulty,
      questionType,
      questionTypes,
      expertiseLevel,
      model = 'gemini',
      geminiModel,
      agentType = 'balanced',
    } = req.body;

    const safeCount = Math.max(1, Math.min(Number(questionCount || cardCount) || 10, 30));

    try {
      const quiz = await quizAgent({
        topic,
        cardCount: safeCount,
        difficulty,
        questionTypes: questionType || questionTypes,
        expertiseLevel,
        model,
        geminiModel,
        agentType,
      });
      res.json(quiz);
    } catch (err) {
      console.error('\n=== QUIZ GENERATION ERROR ===');
      console.error(
        'Error Type:',
        err.isRateLimited ? 'RATE_LIMITED' : err.isAuthError ? 'AUTH_ERROR' : 'UNKNOWN'
      );
      console.error('Message:', err.message || err);
      console.error('===============================\n');

      if (err.details) {
        return res.status(400).json(err.details);
      }
      if (
        err.isRateLimited ||
        err.message?.includes('USAGE LIMIT REACHED') ||
        err.message?.includes('All Gemini models failed')
      ) {
        return res.status(429).json({ error: err.message });
      }
      if (
        err.isAuthError ||
        err.message?.includes('INVALID API KEY') ||
        err.message?.includes('Incorrect API key')
      ) {
        return res.status(401).json({ error: err.message });
      }
      res.status(500).json({ error: err.message || 'Failed to generate quiz' });
    }
  }
);

app.listen(env.port, () => {
  console.log(`\n🔒 Backend listening on port ${env.port}`);
  console.log('✅ Security features enabled:');
  console.log('   • Rate limiting (100 req/15min global, 10 req/15min per generation)');
  console.log('   • Input validation & sanitization');
  console.log('   • CORS protection');
  console.log('   • Helmet security headers');
  console.log('   • Request size limits (10KB max)\n');
});
