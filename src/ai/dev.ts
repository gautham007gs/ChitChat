import { config } from 'dotenv';
config();

import '@/ai/flows/offline-message-generation.ts';
import '@/ai/flows/emotional-state-simulation.ts';
import '@/ai/flows/generate-initial-persona-prompt.ts';
import '@/ai/flows/multilingual-response.ts';

// Illustrative example of how you might run an AI flow function
// if it were exported from its file.
// This code is commented out because the AI flow files likely don't
// currently export functions in a way that can be directly called here,
// but it shows the potential structure for a development testing script.
/*
import { runEmotionalStateSimulation } from '@/ai/flows/emotional-state-simulation'; // Hypothetical import

async function testEmotionalStateFlow() {
  const sampleInput = {
    userMessage: "Hey there!",
    timeOfDay: "morning",
    mood: "neutral",
    recentInteractions: ["User: Hi", "AI: Hello!"]
  };
  const result = await runEmotionalStateSimulation(sampleInput);
  console.log("Emotional State Flow Result:", result);
}

testEmotionalStateFlow().catch(console.error);
*/