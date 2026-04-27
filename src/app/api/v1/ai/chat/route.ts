import { type NextRequest } from "next/server";
import { requireUser, toActor } from "@/server/auth/session";
import { anthropic } from "@/lib/anthropic";
import {
  getOrCreateConversation,
  buildCourseContext,
  appendMessages,
} from "@/services/ai-chat.service";
import { fail } from "@/server/api/response";
import { isAppError } from "@/services/errors";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const ctx = { actor: toActor(user) };
    const { courseId, message } = (await req.json()) as {
      courseId: string;
      message: string;
    };

    const conversation = await getOrCreateConversation(ctx, courseId);
    const courseContext = await buildCourseContext(courseId);

    const history = conversation.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    history.push({ role: "user", content: message });

    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `You are a helpful AI tutor for an educational platform. Answer student questions based on the course content below. Be concise, clear, and educational. If the question is outside the course material, say so kindly.\n\n<course_content>\n${courseContext}\n</course_content>`,
      messages: history,
    });

    let fullResponse = "";
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              fullResponse += event.delta.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`),
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
          // Persist both messages without blocking the response
          appendMessages(conversation.id, [
            { role: "user", content: message },
            { role: "assistant", content: fullResponse },
          ]).catch(() => {});
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    if (isAppError(e)) return fail(e);
    throw e;
  }
}
