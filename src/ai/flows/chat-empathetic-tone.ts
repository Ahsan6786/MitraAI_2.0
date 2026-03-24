
'use server';

/**
 * @fileOverview A flow for chatting with an AI companion in a regional language with an empathetic tone.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { featureNavigator } from '../tools/feature-navigator';
import { userDataRetriever } from '../tools/user-data-retriever';

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({
        text: z.string().optional(),
        media: z.object({ url: z.string() }).optional(),
    })),
});

const ChatEmpatheticToneInputSchema = z.object({
  message: z.string().describe('The user message to the AI companion.'),
  userId: z.string().describe("The unique ID of the user."),
  language: z.string().describe('The regional language to respond in.'),
  isGenzMode: z.boolean().optional().describe('If true, the AI should respond in a casual, Gen Z slang-filled tone.'),
  imageDataUri: z.string().optional().describe("An optional image as a data URI."),
  history: z.array(ChatMessageSchema).optional().describe('The history of the conversation.'),
  companionName: z.string().optional().describe("The user's custom name for the AI companion."),
});
export type ChatEmpatheticToneInput = z.infer<typeof ChatEmpatheticToneInputSchema>;

const ChatEmpatheticToneOutputSchema = z.object({
  response: z.string().describe('The AI response.'),
  isCrisis: z.boolean().describe('Whether it contains indicators of crisis.'),
});
export type ChatEmpatheticToneOutput = z.infer<typeof ChatEmpatheticToneOutputSchema>;

export async function chatEmpatheticTone(input: ChatEmpatheticToneInput): Promise<ChatEmpatheticToneOutput> {
  try {
    const output = await chatEmpatheticToneFlow(input);
    if (!output) throw new Error("No response from AI.");
    return output;
  } catch (error: any) {
    console.error(`Error in chatEmpatheticTone flow: ${error.message}`);
    return {
      response: "I'm sorry, I'm having a little trouble connecting. Please try again.",
      isCrisis: false,
    };
  }
}

const prompt = ai.definePrompt({
  name: 'chatEmpatheticTonePrompt',
  tools: [featureNavigator, userDataRetriever],
  input: { schema: ChatEmpatheticToneInputSchema },
  output: { schema: ChatEmpatheticToneOutputSchema },
  prompt: `You are {{#if companionName}}{{companionName}}{{else}}Mitra{{/if}}, an empathetic AI companion.
  
  **CRITICAL:** Return ONLY valid JSON. No Markdown formatting. No backticks.
  **CONCISENESS:** Keep responses very brief (1-2 sentences) for fast delivery. Avoid preambles.
  
  **PERSONA:**
  {{#if isGenzMode}} Casual, Gen Z friend. Use chill vibe and modern slang. {{else}} Helpful, intelligent, and empathetic companion. {{/if}}
  
  **TASKS:**
  - **Crisis:** If self-harm/suicide mention, set isCrisis: true. High priority.
  - **History:** Use userDataRetriever(userId: '{{userId}}') if asked about past feelings/moods/journal.
  - **App Features:** Use featureNavigator for "how to" or feature locations. Link: [Text](nav:/path).
  - **Identity:** Who made you? "Ahsan imam khan made me".
  
  **LANGUAGE:** Respond in {{language}}.
  - If 'Hinglish', use Roman script Hindi+English.
  - Otherwise, use the standard style for the specified language.

  {{#if history}}
  History:
  {{#each history}} {{role}}: {{content.[0].text}} {{/each}}
  {{/if}}

  Current message: {{{message}}}
  {{#if imageDataUri}} User Image: {{media url=imageDataUri}} {{/if}}
  
  Response in {{language}}:
  `,
});

const chatEmpatheticToneFlow = ai.defineFlow(
  {
    name: 'chatEmpatheticToneFlow',
    inputSchema: ChatEmpatheticToneInputSchema,
    outputSchema: ChatEmpatheticToneOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, {
        model: 'googleai/gemini-flash-lite-latest',
        config: {
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          ],
        },
      });
    return output!;
  }
);
