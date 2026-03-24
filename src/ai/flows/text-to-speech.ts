
'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
  voiceId: z.string().optional().describe('An optional custom voice ID.'),
});

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The base64 encoded audio data URI (WAV format).'),
});

export async function textToSpeech(input: z.infer<typeof TextToSpeechInputSchema>) {
  return textToSpeechFlow(input);
}

// ElevenLabs TTS function
async function generateElevenLabsSpeech(text: string, voiceId: string): Promise<string> {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) throw new Error("ElevenLabs API key is not configured.");
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
    });

    if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return `data:audio/mpeg;base64,${Buffer.from(audioBuffer).toString('base64')}`;
}

// Google TTS using the specialized model
async function generateGoogleSpeech(text: string): Promise<string> {
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', // Fast multimodal model
        config: {
          responseModalities: ['AUDIO'],
        },
        prompt: `Read this text clearly and naturally, focus on a supportive tone: ${text}`,
    });

    if (!media) throw new Error('No media returned from Google TTS.');
    return media.url; 
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async ({ text, voiceId }) => {
    if (!text || !text.trim()) return { audioDataUri: '' };

    try {
        let audioDataUri: string;
        if (voiceId) {
            audioDataUri = await generateElevenLabsSpeech(text, voiceId);
        } else {
            audioDataUri = await generateGoogleSpeech(text);
        }
        return { audioDataUri };
    } catch (error) {
      console.error(`Text-to-speech generation failed: ${error}`);
      return { audioDataUri: '' };
    }
  }
);
