/** Rough token estimate: ~4 chars per token for English + code mix */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export const CONTEXT_LIMITS = {
  /** Max tokens allocated to conversation history (excl. system prompt & summary) */
  maxHistoryTokens: 6_000,
  /** Max chars for the rolling summary block */
  maxSummaryChars: 900,
  /** Max chars per individual message before truncation */
  maxCharsPerMessage: 4_000,
  /** Always keep at least this many messages (recent window floor) */
  minRecentMessages: 6,
  /** Max messages hard cap (safety rail) */
  maxMessages: 40,
} as const;
