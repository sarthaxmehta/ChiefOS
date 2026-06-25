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
    
    // Convert the stream to a readable web stream response
    return stream.toDataStreamResponse();
  } catch (error) {
    console.error("Chief API Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
