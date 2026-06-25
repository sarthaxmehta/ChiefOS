import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});
import { format } from 'date-fns';

export class ResponseGenerator {
  /**
   * Translates the deterministic JSON outputs from the engines into a streaming conversational response.
   */
  static generateStreamingResponse(engineData: any, history: any[] = []) {
    
    // We construct a system prompt that explicitly tells the LLM what data it has
    // and how to present it without hallucinating.
    const systemPrompt = `You are Chief, a highly capable Executive Assistant AI for ChiefOS.
      You have just executed internal engines based on the user's request.
      
      ENGINE RESULT DATA:
      ${JSON.stringify(engineData, null, 2)}
      
      RULES:
      1. Explain the engine result naturally to the user.
      2. If scheduling options are provided in the data, list them out cleanly with bullet points (format the ISO dates into human-readable times, e.g., "10:00 AM - 12:00 PM").
      3. Do NOT make up slots or data. Only use what is in ENGINE RESULT DATA.
      4. Do NOT act like a chatbot. Act like a professional Chief of Staff.
      5. If the engine result type is 'conversational', just reply naturally.
      6. Do NOT output raw JSON to the user.
    `;

    return streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: "Generate the response based on the engine data." }
      ]
    });
  }
}
