import express from 'express';
import { quizAgent } from '../agents/quizAgent.js';
import { storeQuizSession, getQuizSession, deleteQuizSession } from '../utils/quizStorage.js';

export const quizRouter = express.Router();

// Generate quiz questions (answers stored on server)
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
    // Generate full questions with answers
    const questionsWithAnswers = await quizAgent({
      topic,
      cardCount: safeCount,
      difficulty,
      questionTypes: safeTypes,
      expertiseLevel,
      model,
      agentType,
    });

    // Store the full questions (with answers) on the server
    const quizId = storeQuizSession(questionsWithAnswers);

    // Send only questions to the client (no answers or explanations)
    const questionsForClient = questionsWithAnswers.map(q => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options || null,
    }));

    res.json({
      quizId,
      questions: questionsForClient,
    });
  } catch (err) {
    console.error('Failed to generate quiz questions:', err.message || err);
    if (err.details) {
      return res.status(400).json(err.details);
    }
    res.status(500).json({ error: 'Failed to generate quiz questions' });
  }
});

// Submit quiz answers for verification
quizRouter.post('/submit', async (req, res) => {
  const { quizId, answers } = req.body;

  if (!quizId || !answers) {
    return res.status(400).json({
      error: 'Quiz ID and answers are required',
    });
  }

  // Retrieve the stored quiz session
  const session = getQuizSession(quizId);
  
  if (!session) {
    return res.status(404).json({
      error: 'Quiz session not found or expired. Please start a new quiz.',
    });
  }

  const { questions } = session;

  // Verify answers and calculate results
  const results = questions.map(question => {
    const userAnswer = answers[question.id];
    let isCorrect = false;

    // Check if answer is correct
    if (Array.isArray(question.correctAnswer)) {
      // Multi-select question
      isCorrect =
        Array.isArray(userAnswer) &&
        userAnswer.length === question.correctAnswer.length &&
        userAnswer.every(ans => question.correctAnswer.includes(ans));
    } else {
      // Single answer question
      isCorrect = userAnswer === question.correctAnswer;
    }

    return {
      id: question.id,
      type: question.type,
      question: question.question,
      options: question.options,
      userAnswer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      isCorrect,
    };
  });

  // Calculate score
  const correctCount = results.filter(r => r.isCorrect).length;
  const totalCount = results.length;
  const score = Math.round((correctCount / totalCount) * 100);

  // Delete the quiz session after submission
  deleteQuizSession(quizId);

  res.json({
    results,
    score,
    correctCount,
    totalCount,
  });
});
