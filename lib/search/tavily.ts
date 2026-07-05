import type { SearchResult, WebSearchResponse } from "./types";

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

interface TavilyResponse {
  results: TavilyResult[];
}

function normalizeApiKey(raw: string | undefined): string {
  return raw?.trim().replace(/^["']|["']$/g, "") ?? "";
}

export function isWebSearchConfigured(): boolean {
  const key = normalizeApiKey(process.env.TAVILY_API_KEY);
  return key.length > 0 && key.startsWith("tvly-");
}

export function getWebSearchConfigError(): string | null {
  const key = normalizeApiKey(process.env.TAVILY_API_KEY);

  if (!key) {
    return "Add TAVILY_API_KEY to .env — get a free key at https://tavily.com";
  }

  if (!key.startsWith("tvly-")) {
    return "Invalid Tavily API key. Keys start with tvly- — copy yours from the Tavily dashboard.";
  }

  return null;
}

export async function searchWeb(
  query: string,
  maxResults = 5,
): Promise<WebSearchResponse> {
  const configError = getWebSearchConfigError();
  if (configError) {
    throw new Error(configError);
  }

  const apiKey = normalizeApiKey(process.env.TAVILY_API_KEY);
  const trimmed = query.trim();

  if (!trimmed) {
    return { query: trimmed, results: [] };
  }

  const response = await fetch(TAVILY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: trimmed,
      search_depth: "basic",
      max_results: maxResults,
      include_answer: false,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Tavily API key rejected (401). Copy a fresh key from https://tavily.com — it must start with tvly-",
      );
    }
    const detail = await response.text();
    throw new Error(`Web search failed (${response.status}). Try again later.`);
  }

  const data = (await response.json()) as TavilyResponse;

  const results: SearchResult[] = (data.results ?? []).map((item) => ({
    title: item.title,
    url: item.url,
    snippet: item.content.slice(0, 600),
    score: item.score,
  }));

  return { query: trimmed, results };
}
