import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit AI
// Environment variables like GEMINI_API_KEY are automatically used by Genkit if available
// or can be passed explicitly. Next.js handles .env files by default.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (process.env.NODE_ENV === 'production' && !GEMINI_API_KEY) {
  console.error("CRITICAL ERROR: GEMINI_API_KEY is not set in the environment. AI features will fail. Please add it to your Render environment variables.");
}

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