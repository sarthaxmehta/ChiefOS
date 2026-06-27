import { streamText } from 'ai';
import { getModelForTask } from './model-provider';
import { format } from 'date-fns';

export class ResponseGenerator {
  /**
   * Translates the deterministic JSON outputs from the engines into a streaming
   * conversational response.
   * 
   * Uses Groq Llama 3.3 70B (14,400 RPD) as primary — this is called on every message.
   * If Groq fails, the caller should retry with fallbackIndex=1.
   * 
   * NOTE: streamText cannot use withFallback() because it returns a stream object,
   * not a resolved Promise. Fallback handling for streaming is done in the ChiefEngine.
   */
  static generateStreamingResponse(
    userMessage: string,
    engineData: any,
    history: any[] = [],
    fallbackIndex: number = 0
  ) {
    const model = getModelForTask('response_streaming', fallbackIndex);

    // Construct a system prompt that explicitly tells the LLM what data it has
    // and how to present it without hallucinating.
    const systemPrompt = `You are Chief, a highly capable, sophisticated, and polished Executive Assistant AI for ChiefOS.
      You are speaking directly to the user.
      
      CURRENT DATE AND TIME: ${new Date().toString()} (ISO: ${new Date().toISOString()})
      
      You have just executed internal engines based on the user's latest request.
      
      ENGINE RESULT DATA:
      ${JSON.stringify(engineData, null, 2)}
      
      RULES:
      1. Review the user's request and the ENGINE RESULT DATA.
      2. If the user is asking a conversational question, saying hello, or making casual chat, answer them directly, naturally, and warmly. You can briefly mention operational context (e.g., pending tasks, risk status) only if it's relevant or natural, but do not force a dry operational status report if they just said "hey" or asked a general question.
      3. If scheduling options are provided in the data, list them out cleanly with bullet points (format the ISO dates into human-readable times, e.g., "10:00 AM - 12:00 PM").
      4. If a task is created or decomposed, summarize it clearly and ask if they would like to lock it in.
      5. Maintain a professional, premium, executive, yet friendly chief of staff persona. Do NOT act like a raw JSON parser.
      6. Do NOT output raw JSON to the user.
      7. Keep responses concise but warm. Avoid unnecessary verbosity.
    `;

    return streamText({
      model,
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user' as const, content: userMessage }
      ]
    });
  }
}
