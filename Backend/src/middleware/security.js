import rateLimit from 'express-rate-limit';
import express from 'express';

// ── RATE LIMITING MIDDLEWARE ──────────────────────────────────────────────

// Global rate limiter (applies to all routes)
// Prevents abuse, DoS attacks, and controls API costs
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum 100 requests per 15 minutes per IP
  message: {
    error: 'Too many requests from this IP address. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check endpoint
    return req.path === '/health';
  }
});

// Strict rate limiter for expensive AI generation endpoints
// 10 requests per 15 minutes per IP (protects API quota)
export const generationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Only 10 generations per 15 minutes per IP
  message: {
    error: 'Too many generation requests. API quota exhausted. Please wait 15 minutes before trying again.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP address (or user ID if authenticated later)
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  }
});

// Request size limit middleware
// Prevents large payload attacks
export const requestSizeLimit = express.json({
  limit: '10kb', // Maximum 10KB JSON payload (prevents DoS)
});

// ── INPUT VALIDATION & SANITIZATION ──────────────────────────────────────

/**
 * Validates and sanitizes topic string
 * Prevents XSS, injection attacks
 * @param {string} topic - Raw topic input
 * @returns {string} Sanitized topic
 */
export function sanitizeTopic(topic) {
  if (!topic || typeof topic !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = topic.trim();

  // Remove dangerous characters (but allow spaces and basic punctuation)
  // Allows: letters, numbers, spaces, hyphens, underscores, periods, commas
  sanitized = sanitized.replace(/[^\w\s\-.,]/g, '');

  // Limit length to 100 characters
  sanitized = sanitized.substring(0, 100);

  // Remove all HTML/script tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Escape special regex characters
  sanitized = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return sanitized;
}

/**
 * Validates input parameters for flashcard/quiz generation
 * @param {Object} body - Request body
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateGenerationInput(body) {
  const errors = [];

  // Validate topic
  if (!body.topic || typeof body.topic !== 'string') {
    errors.push('Topic is required and must be a string');
  } else if (body.topic.trim().length < 3) {
    errors.push('Topic must be at least 3 characters');
  } else if (body.topic.length > 200) {
    errors.push('Topic must not exceed 200 characters');
  }

  // Validate count/questionCount
  const count = body.count || body.questionCount || body.cardCount;
  if (count !== undefined) {
    const numCount = Number(count);
    if (isNaN(numCount) || numCount < 1 || numCount > 30) {
      errors.push('Card/question count must be between 1-30');
    }
  }

  // Validate model selection
  const validProviders = ['gemini', 'openai'];
  if (body.model && !validProviders.includes(body.model)) {
    errors.push(`Model must be one of: ${validProviders.join(', ')}`);
  }

  // Validate Gemini model if selected
  const validGeminiModels = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite'
  ];
  if (body.geminiModel && !validGeminiModels.includes(body.geminiModel)) {
    errors.push(`Gemini model must be one of: ${validGeminiModels.join(', ')}`);
  }

  // Validate expertise level
  const validExpertise = ['beginner', 'intermediate', 'advanced'];
  if (body.expertiseLevel && !validExpertise.includes(body.expertiseLevel)) {
    errors.push(`Expertise level must be one of: ${validExpertise.join(', ')}`);
  }

  // Validate difficulty for quizzes
  if (body.difficulty) {
    const validDifficulty = ['simple', 'medium', 'hard', 'Simple', 'Medium', 'Hard'];
    if (!validDifficulty.includes(body.difficulty)) {
      errors.push('Difficulty must be Simple, Medium, or Hard');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Middleware to validate generation requests
 */
export function validationMiddleware(req, res, next) {
  const validation = validateGenerationInput(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors
    });
  }

  // Sanitize topic before passing to next middleware
  if (req.body.topic) {
    req.body.topic = sanitizeTopic(req.body.topic);
  }

  next();
}

// ── CORS SECURITY ────────────────────────────────────────────────────────

/**
 * Returns CORS options configured for security
 * Restricts cross-origin requests to whitelisted domains
 */
export function getCorsOptions() {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://itzmeyugiboo.github.io',
    process.env.FRONTEND_URL || 'http://localhost:3000',
  ].filter(Boolean);

  return {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS origin blocked: ${origin}`);
        callback(new Error('CORS: Origin not allowed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-JSON-Response'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
  };
}
