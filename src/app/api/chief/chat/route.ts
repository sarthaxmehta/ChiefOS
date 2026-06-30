import { ChiefEngine } from "@/lib/ai/chief-engine";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const selectedDate = url.searchParams.get("selectedDate") || undefined;
    const { messages } = await req.json();

    const getMessageText = (message: any): string => {
      if (message.content) return message.content;
      if (Array.isArray(message.parts)) {
        return message.parts
          .filter((part: any) => part.type === "text")
          .map((part: any) => part.text)
          .join("");
      }
      return "";
    };

    // Vercel AI SDK format: [{ role: 'user', content: 'hello' }, ...]
    const latestMessage = getMessageText(messages[messages.length - 1]);
    const sanitizedHistory = messages.slice(0, -1).map((m: any) => ({
      role: m.role,
      content: getMessageText(m)
    }));

    const { stream, actionType } = await ChiefEngine.processMessage(latestMessage, sanitizedHistory, selectedDate);
    
    // Revalidate dashboard data for any action that mutates the database
    const dataMutatingActions = ['task_created', 'task_rescheduled', 'task_decomposed'];
    if (dataMutatingActions.includes(actionType)) {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/missions");
      revalidatePath("/dashboard/schedule");
    }

    // Use the latest AI SDK method for returning UI Message streams
    const anyStream = stream as any;
    if (typeof anyStream.toUIMessageStreamResponse === "function") {
      return anyStream.toUIMessageStreamResponse();
    } else if (typeof anyStream.toDataStreamResponse === "function") {
      return anyStream.toDataStreamResponse();
    } else if (typeof anyStream.toTextStreamResponse === "function") {
      return anyStream.toTextStreamResponse();
    } else {
      throw new Error("Could not find a valid stream response method on the AI SDK stream object.");
    }
  } catch (error) {
    console.error("Chief API Error:", error);
    return new Response(error instanceof Error ? error.stack : String(error), { status: 500 });
  }
}
