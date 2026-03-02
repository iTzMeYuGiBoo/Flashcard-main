import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 3001,
  googleApiKey: process.env.GOOGLE_AI_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
};

