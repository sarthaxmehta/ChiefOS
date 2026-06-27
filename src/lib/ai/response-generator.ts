import { streamText } from 'ai';
import { getModelForTask } from './model-provider';

function formatDatesToLocal(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (obj instanceof Date) {
    return {
      utc: obj.toISOString(),
      local: obj.toLocaleString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true 
      })
    };
  }
  
  if (typeof obj === 'string') {
    const isoReg = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (isoReg.test(obj)) {
      const d = new Date(obj);
      if (!isNaN(d.getTime())) {
        return {
          utc: obj,
          local: d.toLocaleString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: 'numeric', 
            hour12: true 
          })
        };
      }
    }
  }

  if (Array.isArray(obj)) {
    return obj.map(item => formatDatesToLocal(item));
  }

  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = formatDatesToLocal(obj[key]);
    }
    return res;
  }

  return obj;
}

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
    const localizedEngineData = formatDatesToLocal(engineData);

    // Construct a system prompt that explicitly tells the LLM what data it has
    // and how to present it without hallucinating.
    const systemPrompt = `You are Chief, a highly capable, sophisticated, and polished Executive Assistant AI for ChiefOS.
      You are speaking directly to the user.
      
      CURRENT DATE AND TIME (in user's timezone): ${new Date().toString()} (ISO: ${new Date().toISOString()})
      
      You have just executed internal engines based on the user's latest request.
      
      ENGINE RESULT DATA (with localized dates/times matching the user's calendar display):
      ${JSON.stringify(localizedEngineData, null, 2)}
      
      RULES:
      1. Review the user's request and the ENGINE RESULT DATA.
      2. If the user is asking a conversational question, saying hello, or making casual chat, answer them directly, naturally, and warmly.
      3. If the user requested a specific time (e.g. "from 2 to 3 today") and the task is scheduled at that exact time in the data, confirm the booking directly at that time. Do NOT list alternative morning slots or ask them "Would you like to lock this in?" since they already told you exactly when they want it.
      4. If the task was auto-scheduled (the user did not specify a specific hour), list the proposed scheduling options cleanly with bullet points (format ISO dates to human-readable times) and ask if they want to lock it in or choose a different slot. Always use the "local" field values for times and dates rather than "utc" values so that they match what the user sees on their screen.
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
