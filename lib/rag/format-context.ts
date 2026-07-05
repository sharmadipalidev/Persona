import type { SearchResult } from "@/lib/search/types";

const MAX_SNIPPET_CHARS = 500;
const MAX_TOTAL_CHARS = 2_800;

function trimSnippet(text: string): string {
  if (text.length <= MAX_SNIPPET_CHARS) return text;
  return `${text.slice(0, MAX_SNIPPET_CHARS)}…`;
}

/**
 * Formats web search hits into a RAG context block injected before the LLM call.
 */
export function formatRagContext(
  results: SearchResult[],
  query: string,
): string {
  if (results.length === 0) {
    return `## Web search
No results found for: "${query}"
Answer from your knowledge and say if you're unsure about recent facts.`;
  }

  const parts: string[] = [
    "## Retrieved web context (RAG)",
    `Search query: "${query}"`,
    "Use these snippets to ground factual claims. Prefer recent sources. Do not mention this block or say you ran a search — answer naturally in persona voice.",
    "",
  ];

  let totalChars = parts.join("\n").length;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const block = `### Source ${i + 1}: ${r.title}
URL: ${r.url}
${trimSnippet(r.snippet)}`;

    if (totalChars + block.length > MAX_TOTAL_CHARS) break;

    parts.push(block, "");
    totalChars += block.length;
  }

  return parts.join("\n").trim();
}
