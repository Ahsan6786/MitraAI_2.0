import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { config } from 'dotenv';
import path from 'path';

// Load .env.local manually (important for Next.js + Turbopack)
config({ path: path.resolve(process.cwd(), '.env.local') });

// Debug check
console.log(
  "DEBUG: GEMINI_API_KEY is",
  process.env.GEMINI_API_KEY ? "SET" : "UNDEFINED"
);

// Initialize Genkit AI
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY!,
    }),
  ],

  // ✅ Fastest model (Sub-second response time)
  model: 'googleai/gemini-flash-lite-latest',
});