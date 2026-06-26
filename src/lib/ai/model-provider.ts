import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export function getAIModel() {
  if (process.env.GROQ_API_KEY) {
    return groq('llama-3.3-70b-versatile');
  } else {
    return google('gemini-2.5-flash');
  }
}
