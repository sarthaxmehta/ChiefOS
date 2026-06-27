import { streamText } from 'ai';
import { getModelForTask } from './model-provider';

/**
 * Recursively converts all Date objects and ISO date strings in an object
 * to { utc, local } pairs so the response LLM uses the user's local timezone.
 */
function formatDatesToLocal(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (obj instanceof Date) {
    return {
      utc: obj.toISOString(),
      local: obj.toLocaleString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hour12: true 
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
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: true 
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
   * conversational response using the user's local timezone for all dates.
   */
  static generateStreamingResponse(
    userMessage: string,
    engineData: any,
    history: any[] = [],
    fallbackIndex: number = 0
  ) {
    const model = getModelForTask('response_streaming', fallbackIndex);
    const localizedEngineData = formatDatesToLocal(engineData);
    const actionType = engineData?.actionResult?.type || 'unknown';

    const systemPrompt = `You are Chief, a highly capable, sophisticated, and polished Executive Assistant AI for ChiefOS.
You are speaking directly to the user.

CURRENT DATE AND TIME (user's timezone): ${new Date().toString()}

ENGINE RESULT DATA (dates shown in user's local timezone):
${JSON.stringify(localizedEngineData, null, 2)}

RESPONSE RULES:

1. CONVERSATIONAL: If the action type is "conversational", respond naturally and warmly. Don't mention engines or internal data.

2. TASK CREATED (user specified a time): If "userSpecifiedTime" is true, confirm the booking directly. Example: "Done! I've scheduled 'Study Session' from 4:00 PM to 5:00 PM today."

3. TASK CREATED (auto-scheduled, one-time): If "isAutoScheduled" is true, mention the auto-scheduled time and offer the user the option to change it. Use the "local" field values for all times.

4. TASK CREATED (recurring, no time): If "isRecurring" is true and "scheduledBlock" is null, confirm the recurring task was created as a reminder without a specific time. Example: "I've created a recurring monthly reminder for 'Electricity Bill Payment'. It's not scheduled to a specific time slot — would you like me to assign one?"

5. TASK RESCHEDULED: Confirm the move with the new date/time. Use "local" values.

6. SCHEDULE RETRIEVED: List the tasks/blocks for the requested day in a clean, readable format with times (use "local" values). If no tasks, say "Your schedule is clear!"

7. STATUS REPORT: Present the workload summary clearly — pending count, completed count, total hours, breakdown by priority/category. Use a professional executive tone.

8. TASK DECOMPOSED: List the subtasks cleanly with estimated durations.

9. ERROR: If the action type is "error", apologize and explain what went wrong.

STYLE:
- Use the "local" date/time field values (never raw "utc" values) so times match the user's calendar.
- Keep responses concise (2-4 sentences for simple actions, more for schedules/reports).
- Professional yet warm — like a chief of staff.
- Never output raw JSON.
- Use markdown formatting (bold, bullet points) for readability.
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
