import { ChiefEngine } from "@/lib/ai/chief-engine";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Vercel AI SDK format: [{ role: 'user', content: 'hello' }, ...]
    const latestMessage = messages[messages.length - 1].content;
    const history = messages.slice(0, -1);

    const stream = await ChiefEngine.processMessage(latestMessage, history);
    
    // Convert the stream to a readable web stream response
    return stream.toDataStreamResponse();
  } catch (error) {
    console.error("Chief API Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
