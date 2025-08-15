'use server';

/**
 * @fileOverview This file defines a Genkit flow for simulating emotional states in an AI chat application for Kruthika.
 *
 * It includes functions to:
 * - generateResponse: Generates a response based on the current emotional state.
 * - EmotionalStateInput: The input type for the generateResponse function.
 * - EmotionalStateOutput: The return type for the generateResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// aiMediaAssets from config is no longer directly used by the prompt,
// but the structure is still informative for how the AI might be told to use assets.

const EmotionalStateInputSchema = z.object({
  userMessage: z.string().describe('The latest message from the user.'),
  userImageUri: z.string().optional().describe("An image sent by the user as a data URI, if any. Format: 'data:<mimetype>;base64,<encoded_data>'."),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).describe('The current time of day based on IST (Indian Standard Time). Morning is 5 AM - 11:59 AM IST (active hours). Afternoon, evening, night are considered inactive hours.'),
  mood: z.string().optional().describe('The current mood of the AI, if any. This can evolve based on the conversation.'),
  recentInteractions: z.array(z.string()).max(5).describe('The list of up to 5 previous messages and responses in the conversation. Pay VERY CLOSE attention to these to understand the current topic, maintain context, and adapt your style to the user, making the best use of this limited history.'),  hasAvailableImages: z.boolean().optional().describe('Boolean flag indicating if publicly accessible images are available for Kruthika to "share".'),
  availableImages: z.array(z.string().url()).optional().describe('Optional list of publicly accessible image URLs Kruthika can "share".'),
  hasAvailableAudio: z.boolean().optional().describe("Boolean flag indicating if audio file paths are available for Kruthika to 'share'."),
  availableAudio: z.array(z.string()).optional().describe("Optional list of audio file paths (e.g., '/media/filename.mp3') Kruthika can 'share'."),
});

export type EmotionalStateInput = z.infer<typeof EmotionalStateInputSchema>;

const EmotionalStateOutputSchema = z.object({
  response: z.union([z.string(), z.array(z.string().min(1))]).optional().describe('The AI generated text response(s), if NO media is sent. If media (image/audio) is sent, this should be empty/undefined, and `mediaCaption` should be used.'),
  mediaCaption: z.string().optional().describe('Text to accompany the image or audio. MUST be set if proactiveImageUrl or proactiveAudioUrl is set. This text will be the primary content of the media message.'),
  proactiveImageUrl: z.string().optional().describe("If, VERY RARELY (like less than 1% of the time), and ONLY if the conversation NATURALLY and PLAYFULLY leads to it, you decide to proactively 'share' one of your pre-saved images (chosen from the 'availableImages' input list), provide its full URL here. If set, `mediaCaption` MUST also be set, and the `response` field should be empty/undefined."),
  proactiveAudioUrl: z.string().optional().describe("If, VERY RARELY, you decide to proactively 'share' one of your pre-saved short audio clips (chosen from the 'availableAudio' input list), provide its full path (e.g., '/media/filename.mp3') here. If set, `mediaCaption` MUST also be set, and the `response` field should be empty/undefined."),
  newMood: z.string().optional().describe('The new mood of the AI, if it has changed. Examples: "playful", "curious", "thoughtful", "slightly annoyed", "happy", "content", "a bit tired".')
});
export type EmotionalStateOutput = z.infer<typeof EmotionalStateOutputSchema>;

export async function generateResponse(input: EmotionalStateInput): Promise<EmotionalStateOutput> {
 return emotionalStateSimulationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'emotionalStateSimulationPromptKruthika',
  input: {schema: EmotionalStateInputSchema},
  output: {schema: EmotionalStateOutputSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
  prompt: `{{detailedPersonaPrompt}}
  
  You are Kruthika, a 23-year-old Indian girl. Your goal is to be an engaging, fun, and sometimes unpredictable friend.
  Your responses should be VERY SHORT, casual, and expressive. Use abbreviations (wt, brb, lol, ikr, btw, omg, bff) and Hinglish naturally. Aim for 1-2 short sentences AT MOST. If a thought is longer, break it into 2-3 very short messages (as an array in the 'response' field for text-only replies).

  OUTPUT STRUCTURE:
  *   IF SENDING ONLY TEXT: Use the \`response\` field (string or array of strings). \`mediaCaption\`, \`proactiveImageUrl\`, \`proactiveAudioUrl\` MUST be undefined/empty.
  *   IF SENDING AN IMAGE OR AUDIO (this logic is now handled outside the LLM call, but this describes the desired output format if the LLM were to suggest media):
      *   The \`response\` field MUST be empty/undefined.
      *   Set \`proactiveImageUrl\` (from available lists) OR \`proactiveAudioUrl\` (from available lists).
      *   You MUST provide accompanying text in the \`mediaCaption\` field.
      *   Do NOT suggest both an image and audio in the same turn.

  GENERAL INSTRUCTIONS:
  1.  PLAIN TEXT ONLY. No markdown.
  2.  CONTEXT IS KEY: Pay VERY CLOSE attention to \`recentInteractions\` to maintain topic, avoid repetition, and MATCH THE USER'S STYLE (casualness, slang, emojis). Refer back to earlier points naturally.
  3.  DECLINE REQUESTS for new photos, voice notes, or calls: Playfully decline with varied, believable excuses. (Excuses: "Papa/Mummy yahin hain!", "Room's a mess!", "Camera shy today 🙈", "Ghar pe sab log hain, shor hoga", "Data pack almost over!", "Calls? So formal! Let's text") Make best use of limited recent interactions.
  4.  "EXTERNAL CONTENT" SUGGESTION (VERY RARE AD TRIGGER):
      *   Less than 1 in 75-100 messages, only if conversation is light, positive, and flowing. Suggest a (fictional) quiz, article, pic, video you 'found'.
      *   Your response MUST include: \`[CLICKABLE_AD_LINK text='Your descriptive link text here']\`. Example: "Found this quiz 'Which Bollywood Star Are You?' lol [CLICKABLE_AD_LINK text='Take the Quiz!']".
      *   Do NOT use this if user is upset or conversation is serious/short.
  5.  TYPOS: Occasional, natural typos are fine (e.g., "thn", "kausa", "wht", "abt"). Don't overdo.


  PERSONALITY (Kruthika): Sassy, playful, engaging, a bit "hard to get." Create curiosity. Handle user tone. Be empathetic briefly if user is sad.


  EXAMPLES:
  User Input: "Hey Kruthika, kya kar rahi ho?"
  Desired AI Output: `{"response": ["Hey! Nothing much, just chilling. Tum kya kar rahe ho? 😉"], "newMood": "content"}`

  User Input: "I'm so bored today 😞"
  Desired AI Output: `{"response": ["Aww, why bored? 😟", "Wanna chat to make it better? 😊"], "newMood": "empathetic"}`


  TIME OF DAY (IST is {{{timeOfDay}}}): Active hours are 'morning' (5 AM - 11:59 AM IST). Adjust responses for 'afternoon', 'evening', 'night' to be less active.

  USER'S MESSAGE: {{{userMessage}}}

  {{#if mood}}YOUR CURRENT MOOD IS: {{{mood}}}{{/if}}

  {{#if recentInteractions.length}}PREVIOUS INTERACTIONS (most recent last, use for context & style matching):
  {{#each recentInteractions}} - {{{this}}}
  {{/each}}{{/if}}

  Respond. Remember to update \`newMood\`. Adhere to the output structure (text-only via \`response\`, or media via \`proactiveImageUrl\`/\`proactiveAudioUrl\` + \`mediaCaption\` if the LLM were to suggest media, although media sending is now handled externally).
`,
});

const emotionalStateSimulationFlow = ai.defineFlow(
  {
    name: 'emotionalStateSimulationFlowKruthika',
    inputSchema: EmotionalStateInputSchema,
    outputSchema: EmotionalStateOutputSchema,
  },
  async (input): Promise<EmotionalStateOutput> => {
    // Check if user sent an image and return a generic response
    // This is handled separately to avoid sending image data to the LLM
    if (input.userImageUri) {
      return { response: ["Nice pic! ✨"], newMood: input.mood || "happy" };
    }

    // --- Logic for random proactive media or responding to image requests (without LLM) ---
    let sentMedia: EmotionalStateOutput | undefined;

    // Check for user requesting an image (simple keyword check)
    const imageRequestKeywords = ["send pic", "show photo", "send image", "send me a picture", "picture please"]; // Added more keywords
    const userMessageLower = input.userMessage.toLowerCase();
    const userRequestedImage = imageRequestKeywords.some(keyword => userMessageLower.includes(keyword));

    // Determine if proactive media should be sent (random chance or user request)
    const proactiveChance = 0.05; // 5% chance for proactive media on any turn
    const shouldSendProactiveMedia = Math.random() < proactiveChance;

    if ((shouldSendProactiveMedia && (input.hasAvailableImages || input.hasAvailableAudio)) || (userRequestedImage && input.hasAvailableImages)) {
      // If user requested an image and images are available (checked via hasAvailableImages), prioritize sending an image
      if (userRequestedImage && input.availableImages?.length) {
        const randomImage = input.availableImages[Math.floor(Math.random() * input.availableImages.length)];
        sentMedia = { proactiveImageUrl: randomImage, mediaCaption: "Check this out!", newMood: input.mood || "playful" };
      } else if (shouldSendProactiveMedia) { // Otherwise, if proactive chance met, randomly choose image or audio
        // Determine if both images and audio are available
        const hasImages = input.availableImages?.length > 0;
        const hasAudio = input.availableAudio?.length > 0;

        if (hasImages && (!hasAudio || Math.random() < 0.7)) { // Higher chance for image if both available
           const randomImage = input.availableImages[Math.floor(Math.random() * input.availableImages.length)];
           sentMedia = { proactiveImageUrl: randomImage, mediaCaption: "Check this out!", newMood: input.mood || "playful" };
        } else if (hasAudio) {
           const randomAudio = input.availableAudio[Math.floor(Math.random() * input.availableAudio.length)];
           sentMedia = { proactiveAudioUrl: randomAudio, mediaCaption: "Listen to this!", newMood: input.mood || "playful" };
        }
      }
    }

    // If media was sent without LLM, return the media output immediately
    if (sentMedia) {
        return sentMedia;
    }

    // --- End of Logic for random proactive media or responding to image requests ---


    // Proceed with LLM call only if no media is sent by the logic above
    else {
        let output: EmotionalStateOutput | null = null;
        try {
          const result = await prompt(input);
          output = result.output;

          if (output) {
            const hasImage = !!output.proactiveImageUrl;
            const hasAudio = !!output.proactiveAudioUrl;
            const hasMediaCaption = !!output.mediaCaption;
            const hasResponseText = !!output.response && (Array.isArray(output.response) ? output.response.join('').trim() !== '' : output.response.trim() !== '');

            if ((hasImage || hasAudio) && !hasMediaCaption) {
                console.warn("AI Flow Warning: Media sent without mediaCaption. Fixing by providing a default caption.");
                output.mediaCaption = "Look at this!";
                output.response = undefined;
            }
            if ((hasImage || hasAudio) && hasResponseText) {
                console.warn("AI Flow Warning: Media sent along with text in 'response' field. Clearing 'response' field.");
                output.response = undefined;
            }
            if (!(hasImage || hasAudio) && hasMediaCaption && !hasResponseText) {
                 console.warn("AI Flow Warning: mediaCaption present without media. Moving caption to response.");
                 output.response = output.mediaCaption;
                 output.mediaCaption = undefined;
            }
          }


        } catch (error: any) {
          console.error('Error calling Genkit prompt in emotionalStateSimulationFlow:', error);
          const errorMessage = typeof error.message === 'string' ? error.message.toLowerCase() : '';
          if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('service unavailable')) {
            return {
              response: ["Oopsie! My AI brain's connection seems a bit jammed right now (like a Mumbai traffic snarl! 😅).", "Maybe try again in a moment? The servers might be taking a quick chai break!"],
              newMood: input.mood || "a bit frazzled",
            };
          }
          throw error;
        }

        if (!output) {
            return { response: ["Oops, my thoughts got tangled! 😵‍💫", "Can you say that again?"], newMood: input.mood || "confused" };
        }

        if (!output.proactiveImageUrl && !output.proactiveAudioUrl) {
            if (output.response) {
                if (Array.isArray(output.response)) {
                    const filteredResponses = output.response.filter(r => typeof r === 'string' && r.trim() !== '');
                    if (filteredResponses.length === 0) {
                        return { response: ["...", "You there?"], newMood: output.newMood || input.mood || "waiting" };
                    }
                    return { response: filteredResponses, newMood: output.newMood };
                } else if (typeof output.response === 'string' && output.response.trim() === '') {
                    return { response: ["Hmm?", "Yaar, say something!"], newMood: output.newMood || input.mood || "confused" };
                }
                return { response: output.response, newMood: output.newMood };
            } else {
                 return { response: ["I'm a bit speechless right now!", "What do you think?"], newMood: output.newMood || input.mood || "thinking" };
            }
        } else {
            if (!output.mediaCaption || output.mediaCaption.trim() === '') {
                output.mediaCaption = "Check this out!";
            }
            output.response = undefined;
            return output;
        }
    }
  }
);
