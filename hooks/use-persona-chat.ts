"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChatMessage, PersonaId } from "@/lib/personas/types";

const STORAGE_PREFIX = "persona-chat:v2";

interface StoredChatState {
  messages: ChatMessage[];
  summary: string | null;
}

function storageKey(personaId: PersonaId) {
  return `${STORAGE_PREFIX}:${personaId}`;
}

function readStoredState(personaId: PersonaId): StoredChatState {
  try {
    const raw = localStorage.getItem(storageKey(personaId));
    if (!raw) return { messages: [], summary: null };

    const parsed = JSON.parse(raw) as StoredChatState | ChatMessage[];

    // Migrate from v1 format (bare message array)
    if (Array.isArray(parsed)) {
      return { messages: parsed, summary: null };
    }

    return {
      messages: parsed.messages ?? [],
      summary: parsed.summary ?? null,
    };
  } catch {
    return { messages: [], summary: null };
  }
}

function writeStoredState(personaId: PersonaId, state: StoredChatState) {
  try {
    localStorage.setItem(storageKey(personaId), JSON.stringify(state));
  } catch {
    // quota exceeded or private browsing
  }
}

export function usePersonaChat(personaId: PersonaId) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredState(personaId);
    setMessages(stored.messages);
    setSummary(stored.summary);
    setHydrated(true);
  }, [personaId]);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredState(personaId, { messages, summary });
  }, [messages, summary, personaId, hydrated]);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateLastAssistant = useCallback((content: string) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant") {
        next[next.length - 1] = { ...last, content };
      }
      return next;
    });
  }, []);

  const updateSummary = useCallback((next: string | null) => {
    setSummary(next);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSummary(null);
    try {
      localStorage.removeItem(storageKey(personaId));
    } catch {
      // ignore
    }
  }, [personaId]);

  return {
    messages,
    summary,
    hydrated,
    appendMessage,
    updateLastAssistant,
    updateSummary,
    clearMessages,
    setMessages,
  };
}

export function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function parseSummaryHeader(response: Response): string | null {
  const raw = response.headers.get("X-Conversation-Summary");
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function parseSearchErrorHeader(response: Response): string | null {
  const raw = response.headers.get("X-Web-Search-Error");
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
