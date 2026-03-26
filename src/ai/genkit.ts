import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit AI
// Environment variables like GEMINI_API_KEY are automatically used by Genkit if available
// or can be passed explicitly. Next.js handles .env files by default.

// Initialize Genkit AI
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],

  // ✅ Fastest model (Sub-second response time)
  model: 'googleai/gemini-flash-lite-latest',
});