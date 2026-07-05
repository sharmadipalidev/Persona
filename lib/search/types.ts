export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

export interface WebSearchResponse {
  results: SearchResult[];
  query: string;
}
