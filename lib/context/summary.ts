import type { ChatMessage } from "@/lib/personas/types";
import { CONTEXT_LIMITS, estimateTokens } from "./tokens";

function trimContent(content: string): string {
  const { maxCharsPerMessage } = CONTEXT_LIMITS;
  if (content.length <= maxCharsPerMessage) return content;
  return `${content.slice(0, maxCharsPerMessage)}… [truncated]`;
}

function firstLine(text: string, maxLen = 140): string {
  const line = text.split("\n").find((l) => l.trim().length > 0) ?? text;
  const cleaned = line.replace(/\s+/g, " ").trim();
  return cleaned.length <= maxLen ? cleaned : `${cleaned.slice(0, maxLen - 1)}…`;
}

/**
 * Build a compact, heuristic summary of pruned messages — no extra LLM call.
 * Captures what was discussed so the persona can stay coherent across long threads.
 */
export function buildDroppedSummary(dropped: ChatMessage[]): string {
  if (dropped.length === 0) return "";

  const userTopics = dropped
    .filter((m) => m.role === "user")
    .map((m) => firstLine(m.content));

  const assistantHighlights = dropped
    .filter((m) => m.role === "assistant" && m.content.trim().length > 0)
    .map((m) => firstLine(m.content, 160));

  const parts: string[] = [
    "Earlier in this conversation (compressed memory):",
  ];

  if (userTopics.length > 0) {
    parts.push(
      "Student asked about:",
      ...userTopics.map((t) => `• ${t}`),
    );
  }

  if (assistantHighlights.length > 0) {
    parts.push(
      "You already explained:",
      ...assistantHighlights.slice(-6).map((h) => `• ${h}`),
    );
  }

  parts.push(
    "Continue naturally. Do not repeat full explanations unless the student asks again.",
  );

  return parts.join("\n");
}

export function mergeSummaries(
  existing: string | null,
  newChunk: string,
): string {
  if (!newChunk.trim()) return existing ?? "";
  if (!existing?.trim()) return capSummary(newChunk);

  const combined = `${existing.trim()}\n\n---\n${newChunk.trim()}`;
  return capSummary(combined);
}

export function capSummary(text: string): string {
  const { maxSummaryChars } = CONTEXT_LIMITS;
  if (text.length <= maxSummaryChars) return text;
  return `…${text.slice(-(maxSummaryChars - 1))}`;
}
