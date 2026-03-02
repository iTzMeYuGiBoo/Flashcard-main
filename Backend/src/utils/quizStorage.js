import crypto from 'crypto';

// In-memory storage for active quiz sessions
// Structure: { quizId: { questions: [...], createdAt: timestamp, expiresAt: timestamp } }
const quizSessions = new Map();

// Quiz sessions expire after 2 hours
const EXPIRATION_TIME = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

/**
 * Generate a unique quiz ID
 */
function generateQuizId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Clean up expired quiz sessions
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [quizId, session] of quizSessions.entries()) {
    if (session.expiresAt < now) {
      quizSessions.delete(quizId);
    }
  }
}

/**
 * Store a new quiz session
 * @param {Array} questions - Full questions with answers
 * @returns {string} quizId
 */
export function storeQuizSession(questions) {
  cleanupExpiredSessions();
  
  const quizId = generateQuizId();
  const now = Date.now();
  
  quizSessions.set(quizId, {
    questions,
    createdAt: now,
    expiresAt: now + EXPIRATION_TIME,
  });
  
  return quizId;
}

/**
 * Get quiz session by ID
 * @param {string} quizId
 * @returns {Object|null} Session data or null if not found/expired
 */
export function getQuizSession(quizId) {
  cleanupExpiredSessions();
  
  const session = quizSessions.get(quizId);
  if (!session) {
    return null;
  }
  
  // Check if expired
  if (session.expiresAt < Date.now()) {
    quizSessions.delete(quizId);
    return null;
  }
  
  return session;
}

/**
 * Delete a quiz session (after submission or cancellation)
 * @param {string} quizId
 */
export function deleteQuizSession(quizId) {
  quizSessions.delete(quizId);
}

/**
 * Get storage stats (for monitoring)
 */
export function getStorageStats() {
  cleanupExpiredSessions();
  return {
    activeSessions: quizSessions.size,
    memoryUsage: process.memoryUsage(),
  };
}

// Cleanup expired sessions every 10 minutes
setInterval(cleanupExpiredSessions, 10 * 60 * 1000);
