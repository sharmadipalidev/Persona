import type { ChatMessage } from "@/lib/personas/types";
import {
  buildDroppedSummary,
  capSummary as capSummaryText,
  mergeSummaries,
} from "./summary";
import { CONTEXT_LIMITS, estimateTokens } from "./tokens";

export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ContextBuildInput {
  systemPrompt: string;
  history: ChatMessage[];
  /** Rolling summary from prior pruned turns (client-persisted) */
  existingSummary?: string | null;
  /** Web search RAG context for the current turn */
  ragContext?: string | null;
}

export interface ContextBuildResult {
  messages: OpenAIMessage[];
  updatedSummary: string | null;
  meta: {
    totalMessages: number;
    keptMessages: number;
    droppedMessages: number;
    estimatedInputTokens: number;
    summaryActive: boolean;
    ragActive: boolean;
  };
}

function trimContent(content: string): string {
  const { maxCharsPerMessage } = CONTEXT_LIMITS;
  if (content.length <= maxCharsPerMessage) return content;
  return `${content.slice(0, maxCharsPerMessage)}… [truncated]`;
}

function normalizeHistory(history: ChatMessage[]): ChatMessage[] {
  return history
    .filter((m) => m.content.trim().length > 0)
    .map((m) => ({ ...m, content: trimContent(m.content) }));
}

/**
 * Select recent messages from the end until the token budget is reached.
 * Preserves turn integrity — won't start mid-pair on a lone assistant message.
 */
function selectWithinBudget(
  messages: ChatMessage[],
  tokenBudget: number,
): { kept: ChatMessage[]; dropped: ChatMessage[] } {
  const { minRecentMessages, maxMessages } = CONTEXT_LIMITS;

  if (messages.length === 0) {
    return { kept: [], dropped: [] };
  }

  const capped = messages.slice(-maxMessages);
  const prefixDropped = messages.length > capped.length ? messages.slice(0, messages.length - capped.length) : [];

  let tokens = 0;
  const keptFromEnd: ChatMessage[] = [];

  for (let i = capped.length - 1; i >= 0; i--) {
    const msg = capped[i];
    const msgTokens = estimateTokens(msg.content);

    if (
      tokens + msgTokens > tokenBudget &&
      keptFromEnd.length >= minRecentMessages
    ) {
      break;
    }

    keptFromEnd.unshift(msg);
    tokens += msgTokens;
  }

  // Drop leading assistant orphan so context starts on a user turn
  while (keptFromEnd.length > 0 && keptFromEnd[0].role === "assistant") {
    keptFromEnd.shift();
  }

  const keptStartIndex = capped.length - keptFromEnd.length;
  const droppedFromCapped = capped.slice(0, keptStartIndex);
  const dropped = [...prefixDropped, ...droppedFromCapped];

  return { kept: keptFromEnd, dropped };
}

function buildSummarySystemBlock(summary: string): string {
  return `## Conversation memory (do not mention this block to the student)
${summary}`;
}

/**
 * Assembles the full LLM message array:
 * 1. Persona system prompt
 * 2. Optional rolling summary (system)
 * 3. Token-budgeted recent turns
 */
export function buildMessageContext(
  input: ContextBuildInput,
): ContextBuildResult {
  const normalized = normalizeHistory(input.history);
  const { maxHistoryTokens } = CONTEXT_LIMITS;

  const { kept, dropped } = selectWithinBudget(normalized, maxHistoryTokens);

  let updatedSummary = input.existingSummary?.trim() || null;

  if (dropped.length > 0) {
    const chunk = buildDroppedSummary(dropped);
    updatedSummary = mergeSummaries(updatedSummary, chunk) || null;
  }

  if (updatedSummary) {
    updatedSummary = capSummaryText(updatedSummary);
  }

  const openaiMessages: OpenAIMessage[] = [
    { role: "system", content: input.systemPrompt },
  ];

  if (input.ragContext?.trim()) {
    openaiMessages.push({
      role: "system",
      content: input.ragContext.trim(),
    });
  }

  if (updatedSummary) {
    openaiMessages.push({
      role: "system",
      content: buildSummarySystemBlock(updatedSummary),
    });
  }

  for (const msg of kept) {
    openaiMessages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Trailing nudge — models weight recent instructions heavily
  openaiMessages.push({
    role: "system",
    content:
      "Reply NOW in under 100 words. Chat only. No steps, no roadmaps, no code blocks.",
  });

  const estimatedInputTokens = openaiMessages.reduce(
    (sum, m) => sum + estimateTokens(m.content),
    0,
  );

  return {
    messages: openaiMessages,
    updatedSummary,
    meta: {
      totalMessages: normalized.length,
      keptMessages: kept.length,
      droppedMessages: dropped.length,
      estimatedInputTokens,
      summaryActive: Boolean(updatedSummary),
      ragActive: Boolean(input.ragContext?.trim()),
    },
  };
}

export { estimateTokens, CONTEXT_LIMITS } from "./tokens";
