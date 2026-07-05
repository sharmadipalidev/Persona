export type PersonaId = "hitesh" | "piyush";

export interface PersonaProfile {
  id: PersonaId;
  name: string;
  tagline: string;
  role: string;
  accent: string;
  accentMuted: string;
  initials: string;
  image: string;
  topics: string[];
  website: string;
  github?: string;
  systemPrompt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}
