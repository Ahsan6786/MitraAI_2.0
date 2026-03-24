import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { config } from 'dotenv';
import path from 'path';

// In production (Render/Vercel), environment variables are provided by the system.
// Next.js automatically loads .env files in dev mode.
// We only load manually if we are in a non-standard environment.
if (process.env.NODE_ENV !== 'production' && !process.env.GEMINI_API_KEY) {
    config({ path: path.resolve(process.cwd(), '.env.local') });
}

console.log(
  "DEBUG: GEMINI_API_KEY is",
  process.env.GEMINI_API_KEY ? "SET (Length: " + process.env.GEMINI_API_KEY.length + ")" : "UNDEFINED"
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