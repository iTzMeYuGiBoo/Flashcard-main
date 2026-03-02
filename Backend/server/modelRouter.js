import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY;

// In this initial implementation we only support Gemini directly.
// The shape is designed so we can easily plug in ChatGPT or a custom model later.
export class ModelRouter {
  constructor() {
    this.geminiClient = GOOGLE_API_KEY ? new GoogleGenAI({ apiKey: GOOGLE_API_KEY }) : null;
  }

  /**
   * Rough token estimation: ~4 chars per token.
   */
  static estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Ensures prompts stay under a soft token budget by truncating text.
   */
  static enforceBudget(text, maxPromptTokens = 2048) {
    const est = ModelRouter.estimateTokens(text);
    if (est <= maxPromptTokens) return text;
    const ratio = maxPromptTokens / est;
    const newLength = Math.floor(text.length * ratio);
    return text.slice(0, newLength);
  }

  /**
   * Unified interface for calling different model providers.
   * For now, only 'gemini' is implemented.
   */
  async callModel({
    provider = 'gemini',
    model = 'models/gemini-2.5-flash',
    systemPrompt,
    userPrompt,
    maxTokens = 1024,
    temperature = 0.4,
  }) {
    const trimmedUserPrompt = ModelRouter.enforceBudget(userPrompt, 2048);

    switch (provider) {
      case 'gemini': {
        if (!this.geminiClient) {
          throw new Error('GOOGLE_AI_API_KEY is not configured');
        }

        const promptParts = [];
        if (systemPrompt) {
          promptParts.push({ text: systemPrompt });
        }
        promptParts.push({ text: trimmedUserPrompt });

        const result = await this.geminiClient.models.generateContent({
          model,
          contents: [{ role: 'user', parts: promptParts }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
          },
        });

        const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return rawText;
      }
      case 'openai':
      case 'custom':
      default:
        throw new Error(`Provider '${provider}' is not implemented yet.`);
    }
  }
}

