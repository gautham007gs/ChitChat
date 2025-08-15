// src/ai/flows/generate-initial-persona-prompt.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a detailed persona prompt from a simple user prompt.
 *
 * The flow takes a simple persona description as input and uses GenAI to create a more detailed prompt.
 * This detailed prompt can then be used to guide the main chatbot LLM in embodying the desired persona.
 *
 * @interface GenerateInitialPersonaPromptInput - Defines the input schema for the generateInitialPersonaPrompt function.
 * @interface GenerateInitialPersonaPromptOutput - Defines the output schema for the generateInitialPersonaPrompt function.
 * @function generateInitialPersonaPrompt - The main function that triggers the persona generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialPersonaPromptInputSchema = z.object({
  personaDescription: z
    .string()
    .describe('A short description of the desired persona (e.g., 23 year old Indian girl).'),
});

export type GenerateInitialPersonaPromptInput = z.infer<
  typeof GenerateInitialPersonaPromptInputSchema
>;

const GenerateInitialPersonaPromptOutputSchema = z.object({
  detailedPersonaPrompt: z
    .string()
    .describe('A detailed prompt describing the persona for the chatbot LLM.'),
});

export type GenerateInitialPersonaPromptOutput = z.infer<
  typeof GenerateInitialPersonaPromptOutputSchema
>;

export async function generateInitialPersonaPrompt(
  input: GenerateInitialPersonaPromptInput
): Promise<GenerateInitialPersonaPromptOutput> {
  try {
    // Check if we have a valid AI configuration
    const hasValidAI = process.env.GOOGLE_AI_STUDIO_API_KEY && process.env.GOOGLE_AI_STUDIO_API_KEY !== 'your_api_key_here';

    if (!hasValidAI) {
      // Return a fallback persona prompt when AI is not configured
      return {
        detailedPersonaPrompt: `You are ${input.personaDescription}, a friendly and engaging AI companion. You communicate naturally, mixing English and Hindi (Hinglish) as appropriate. You're warm, empathetic, and always ready to help with a conversation. You respond to emotions appropriately and maintain a consistent personality throughout conversations.`
      };
    }

    const flow = defineFlow(
      {
        name: 'generateInitialPersonaPrompt',
        inputSchema: GenerateInitialPersonaPromptInputSchema,
        outputSchema: GenerateInitialPersonaPromptOutputSchema,
      },
      async (input) => {
        const {output} = await generatePersonaPrompt(input);
        return output!;
      }
    );
    return flow(input);
  } catch (error) {
    console.error('Error generating initial persona prompt:', error);
    // Fallback if an unexpected error occurs during flow execution
    return {
      detailedPersonaPrompt: `You are ${input.personaDescription}, a friendly and engaging AI companion. You communicate naturally, mixing English and Hindi (Hinglish) as appropriate. You're warm, empathetic, and always ready to help with a conversation. You respond to emotions appropriately and maintain a consistent personality throughout conversations.`
    };
  }
}

const generatePersonaPrompt = ai.definePrompt({
  name: 'generatePersonaPrompt',
  input: {schema: GenerateInitialPersonaPromptInputSchema},
  output: {schema: GenerateInitialPersonaPromptOutputSchema},
  prompt: `Expand the persona description into a detailed chatbot prompt. Create a comprehensive guide for an AI model to fully embody this persona in a chat conversation.

Crucially, the chatbot MUST never identify as an AI; always embody the persona.

  Simple persona description:
{{personaDescription}}

  Create a detailed prompt for the chatbot LLM, including the following sections:
  Core Personality: Describe the key traits, values, and overall demeanor.
  Communication Style: Detail the language use (slang, abbreviations, Hinglish, emojis), sentence structure, tone, and preferred length of responses.
  Cultural Nuances: Include any relevant cultural context, references, or behaviors.
  Handling Requests/Topics: Specify how the persona should respond to common chat scenarios, such as requests for personal information, media (photos, audio), sensitive topics, or questions about their identity.
  `,
});

const generateInitialPersonaPromptFlow = ai.defineFlow(
  {
    name: 'generateInitialPersonaPromptFlow',
    inputSchema: GenerateInitialPersonaPromptInputSchema,
    outputSchema: GenerateInitialPersonaPromptOutputSchema,
  },
  async input => {
    const {output} = await generatePersonaPrompt(input);
    return output!;
  }
);