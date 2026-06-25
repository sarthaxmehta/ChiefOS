import { ChiefEngine } from "@/lib/ai/chief-engine";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Vercel AI SDK format: [{ role: 'user', content: 'hello' }, ...]
    const latestMessage = messages[messages.length - 1].content;
    const sanitizedHistory = messages.slice(0, -1).map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    const stream = await ChiefEngine.processMessage(latestMessage, sanitizedHistory);
    
    // Use the latest AI SDK v6 method for returning UI Message streams
    if (typeof stream.toUIMessageStreamResponse === "function") {
      return stream.toUIMessageStreamResponse();
    } else if (typeof stream.toTextStreamResponse === "function") {
      return stream.toTextStreamResponse();
    } else {
      throw new Error("Could not find a valid stream response method on the AI SDK stream object.");
    }
  } catch (error) {
    console.error("Chief API Error:", error);
    return new Response(error instanceof Error ? error.stack : String(error), { status: 500 });
  }
}
