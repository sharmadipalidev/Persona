import { buildMessageContext } from "@/lib/context";
import { createMistralClient, MISTRAL_MODEL } from "@/lib/mistral";
import { getPersona, type PersonaId } from "@/lib/personas";
import type { ChatMessage } from "@/lib/personas/types";
import { formatRagContext } from "@/lib/rag";
import {
  getWebSearchConfigError,
  searchWeb,
} from "@/lib/search";

export const runtime = "nodejs";

const SUMMARY_HEADER = "X-Conversation-Summary";

interface ChatRequestBody {
  personaId: PersonaId;
  messages: ChatMessage[];
  summary?: string | null;
  webSearch?: boolean;
}

function isValidPersonaId(value: unknown): value is PersonaId {
  return value === "hitesh" || value === "piyush";
}

function getLastUserMessage(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user" && messages[i].content.trim()) {
      return messages[i].content.trim();
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;

    if (!isValidPersonaId(body.personaId)) {
      return Response.json({ error: "Invalid persona" }, { status: 400 });
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: "Messages are required" }, { status: 400 });
    }

    if (body.webSearch) {
      const configError = getWebSearchConfigError();
      if (configError) {
        return Response.json({ error: configError }, { status: 503 });
      }
    }

    const persona = getPersona(body.personaId);

    let ragContext: string | null = null;
    let searchResultCount = 0;
    let searchWarning: string | null = null;

    if (body.webSearch) {
      const query = getLastUserMessage(body.messages);
      if (query) {
        try {
          const { results, query: searchedQuery } = await searchWeb(query);
          searchResultCount = results.length;
          ragContext = formatRagContext(results, searchedQuery);
        } catch (error) {
          searchWarning =
            error instanceof Error
              ? error.message
              : "Web search failed. Answering without live results.";
        }
      }
    }

    const { messages: openaiMessages, updatedSummary, meta } =
      buildMessageContext({
        systemPrompt: persona.systemPrompt,
        history: body.messages,
        existingSummary: body.summary ?? null,
        ragContext,
      });

    const client = createMistralClient();

    const stream = await client.chat.completions.create({
      model: MISTRAL_MODEL,
      messages: openaiMessages,
      stream: true,
      temperature: 0.55,
      max_tokens: 400,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Stream failed";
          controller.enqueue(encoder.encode(`\n\n[Error: ${message}]`));
        } finally {
          controller.close();
        }
      },
    });

    const headers = new Headers({
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Context-Kept": String(meta.keptMessages),
      "X-Context-Dropped": String(meta.droppedMessages),
      "X-Context-Tokens": String(meta.estimatedInputTokens),
      "X-Web-Search": body.webSearch ? "true" : "false",
      "X-Web-Search-Results": String(searchResultCount),
    });

    if (updatedSummary) {
      headers.set(SUMMARY_HEADER, encodeURIComponent(updatedSummary));
    }

    if (searchWarning) {
      headers.set("X-Web-Search-Error", encodeURIComponent(searchWarning));
    }

    return new Response(readable, { headers });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("_API_KEY") ? 503 : 500;
    return Response.json({ error: message }, { status });
  }
}
