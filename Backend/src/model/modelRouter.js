import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { env } from '../config/env.js';

const GOOGLE_API_KEY = env.googleApiKey;
const OPENAI_API_KEY = env.openaiApiKey;

// ── Available Gemini Models (Free Tier) ──────────────────────────────
// Each model has a fallback chain: if quota/404 hits, try the next one.
export const GEMINI_MODELS = {
  // Text Generation Models
  'gemini-2.5-flash':      { name: 'Gemini 2.5 Flash',      type: 'text',  desc: 'Latest & fastest, thinking capabilities' },
  'gemini-2.5-pro':        { name: 'Gemini 2.5 Pro',        type: 'text',  desc: 'Most capable, complex reasoning' },
  'gemini-2.0-flash':      { name: 'Gemini 2.0 Flash',      type: 'text',  desc: 'Fast multimodal, agentic tasks' },
  'gemini-2.0-flash-lite': { name: 'Gemini 2.0 Flash Lite', type: 'text',  desc: 'Cost-efficient, everyday tasks' },
  // Image Generation Models
  'gemini-2.0-flash':      { name: 'Gemini 2.0 Flash',      type: 'image', desc: 'Text-to-image and image editing' },
  'imagen-3.0-generate-002': { name: 'Imagen 3',            type: 'image', desc: 'High quality image generation' },
  // Video Understanding (input only)
  'gemini-2.5-flash':      { name: 'Gemini 2.5 Flash',      type: 'video', desc: 'Video understanding & analysis' },
};

// Text model fallback order (tried in sequence if one fails)
export const TEXT_MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-pro',
];

export class ModelRouter {
  constructor() {
    this.geminiClient = GOOGLE_API_KEY ? new GoogleGenAI({ apiKey: GOOGLE_API_KEY }) : null;
    this.openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
  }

  static estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  static enforceBudget(text, maxPromptTokens = 1024) {
    const est = ModelRouter.estimateTokens(text);
    if (est <= maxPromptTokens) return text;
    const ratio = maxPromptTokens / est;
    const newLength = Math.floor(text.length * ratio);
    return text.slice(0, newLength);
  }

  // ── Single Gemini API call (no fallback) ───────────────────────────
  async _callGemini({ model, promptParts, maxTokens, temperature }) {
    const result = await this.geminiClient.models.generateContent({
      model,
      contents: [{ role: 'user', parts: promptParts }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    });
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // ── Gemini with automatic fallback chain ───────────────────────────
  async _callGeminiWithFallback({ model, promptParts, maxTokens, temperature }) {
    if (!this.geminiClient) {
      throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    // Build the fallback chain: start with the requested model, then try others
    const chain = [model, ...TEXT_MODEL_FALLBACK_CHAIN.filter((m) => m !== model)];
    const errors = [];

    for (const currentModel of chain) {
      try {
        console.log(`[GEMINI] Trying model: ${currentModel}`);
        const result = await this._callGemini({ model: currentModel, promptParts, maxTokens, temperature });
        if (currentModel !== model) {
          console.log(`[GEMINI] ✓ Fallback succeeded with: ${currentModel} (original: ${model})`);
        } else {
          console.log(`[GEMINI] ✓ Success with: ${currentModel}`);
        }
        return result;
      } catch (err) {
        const isRetryable =
          err.message?.includes('429') ||
          err.message?.includes('RESOURCE_EXHAUSTED') ||
          err.message?.includes('quota') ||
          err.message?.includes('404') ||
          err.message?.includes('NOT_FOUND');

        console.error(`[GEMINI] ✗ ${currentModel} failed: ${err.message?.slice(0, 120)}`);
        errors.push({ model: currentModel, error: err.message });

        if (!isRetryable) {
          // Non-retryable error (auth, network, etc.) — stop immediately
          throw err;
        }
        // Retryable — continue to next model in chain
      }
    }

    // All models exhausted
    console.error('\n=== ALL GEMINI MODELS EXHAUSTED ===');
    errors.forEach((e) => console.error(`  ${e.model}: ${e.error?.slice(0, 100)}`));
    console.error('===================================\n');

    const exhaustedError = new Error(
      `All Gemini models failed. Tried: ${errors.map((e) => e.model).join(', ')}. ` +
      'Your API quota may be exhausted — try again later or use ChatGPT.'
    );
    exhaustedError.isRateLimited = true;
    exhaustedError.provider = 'gemini';
    throw exhaustedError;
  }

  async callModel({
    provider = 'gemini',
    model = 'gemini-2.5-flash',
    systemPrompt,
    userPrompt,
    maxTokens = 800,
    temperature = 0.4,
  }) {
    const trimmedUserPrompt = ModelRouter.enforceBudget(userPrompt, 1024);

    try {
      switch (provider) {
        case 'gemini': {
          const promptParts = [];
          if (systemPrompt) {
            promptParts.push({ text: systemPrompt });
          }
          promptParts.push({ text: trimmedUserPrompt });

          return await this._callGeminiWithFallback({ model, promptParts, maxTokens, temperature });
        }
        case 'openai': {
          if (!this.openaiClient) {
            throw new Error('OPENAI_API_KEY is not configured');
          }

          const messages = [];
          if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
          }
          messages.push({ role: 'user', content: trimmedUserPrompt });

          try {
            const completion = await this.openaiClient.chat.completions.create({
              model: model || 'gpt-4o-mini',
              messages,
              max_tokens: maxTokens,
              temperature,
            });

            return completion.choices[0]?.message?.content || '';
          } catch (openaiErr) {
            console.error('OpenAI API Error:', openaiErr);
            if (openaiErr.message?.includes('429') || openaiErr.message?.includes('rate_limit')) {
              const quotaError = new Error('API KEY USAGE LIMIT REACHED - OpenAI quota exceeded. Please try again later or check your billing.');
              quotaError.isRateLimited = true;
              quotaError.provider = 'openai';
              throw quotaError;
            }
            if (openaiErr.message?.includes('401') || openaiErr.message?.includes('Incorrect API key')) {
              const authError = new Error('INVALID API KEY - OpenAI API key is incorrect or invalid.');
              authError.isAuthError = true;
              authError.provider = 'openai';
              throw authError;
            }
            throw openaiErr;
          }
        }
        default:
          throw new Error(`Provider '${provider}' is not supported. Use 'gemini' or 'openai'.`);
      }
    } catch (error) {
      console.error(`[${provider.toUpperCase()}] Error:`, error.message);
      throw error;
    }
  }
}

// Export available models for the /api/models endpoint
export function getAvailableModels() {
  return {
    gemini: {
      text: [
        { id: 'gemini-2.5-flash',      name: 'Gemini 2.5 Flash',      desc: 'Latest & fastest, thinking capabilities',     free: '500 req/day' },
        { id: 'gemini-2.5-pro',        name: 'Gemini 2.5 Pro',        desc: 'Most capable, complex reasoning',             free: '25 req/day' },
        { id: 'gemini-2.0-flash',      name: 'Gemini 2.0 Flash',      desc: 'Fast multimodal, agentic tasks',              free: '1500 req/day' },
        { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', desc: 'Cost-efficient, everyday tasks',              free: '1500 req/day' },
      ],
      image: [
        { id: 'gemini-2.0-flash',        name: 'Gemini 2.0 Flash (Image)', desc: 'Text-to-image and image editing',        free: '1500 req/day' },
        { id: 'imagen-3.0-generate-002', name: 'Imagen 3',                 desc: 'High quality image generation',          free: 'Limited' },
      ],
      video: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Video)', desc: 'Video understanding & analysis (input)', free: '500 req/day' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Video)', desc: 'Video understanding (input)',            free: '1500 req/day' },
      ],
    },
    openai: {
      text: [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Fast and affordable', free: 'Pay-per-use' },
        { id: 'gpt-4o',      name: 'GPT-4o',      desc: 'Most capable OpenAI model', free: 'Pay-per-use' },
      ],
    },
    fallbackChain: TEXT_MODEL_FALLBACK_CHAIN,
  };
}

