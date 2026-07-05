"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Globe, RotateCcw, BrainCircuit, Sparkles, Loader2 } from "lucide-react";
import { PersonaAvatar } from "@/components/chat/persona-avatar";
import { MessageList } from "@/components/chat/message-list";
import { PersonaSidebar } from "@/components/chat/persona-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createMessageId,
  parseSearchErrorHeader,
  parseSummaryHeader,
  usePersonaChat,
} from "@/hooks/use-persona-chat";
import { getPersona, personaList, type PersonaId } from "@/lib/personas";
import { cn } from "@/lib/utils";

const SUGGESTIONS: Record<PersonaId, string[]> = {
  hitesh: [
    "How do I start MERN from scratch?",
    "DSA roadmap for placements?",
    "Explain REST API simply",
  ],
  piyush: [
    "How does RAG work in production?",
    "Docker vs Kubernetes for a startup?",
    "System design for a URL shortener",
  ],
};

export function ChatStudio() {
  const [activePersonaId, setActivePersonaId] = useState<PersonaId>("hitesh");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [searchWarning, setSearchWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const persona = getPersona(activePersonaId);
  const {
    messages,
    summary,
    hydrated,
    appendMessage,
    updateLastAssistant,
    updateSummary,
    clearMessages,
  } = usePersonaChat(activePersonaId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      setSearchWarning(null);
      setInput("");

      const userMessage = {
        id: createMessageId(),
        role: "user" as const,
        content: trimmed,
        createdAt: Date.now(),
      };

      const assistantMessage = {
        id: createMessageId(),
        role: "assistant" as const,
        content: "",
        createdAt: Date.now(),
      };

      const historyForApi = [...messages, userMessage];
      appendMessage(userMessage);
      appendMessage(assistantMessage);
      setIsStreaming(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personaId: activePersonaId,
            messages: historyForApi,
            summary,
            webSearch,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "Request failed");
        }

        const nextSummary = parseSummaryHeader(response);
        if (nextSummary) {
          updateSummary(nextSummary);
        }

        const searchErr = parseSearchErrorHeader(response);
        if (searchErr) {
          setSearchWarning(searchErr);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          updateLastAssistant(accumulated);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        updateLastAssistant(
          `Sorry, I couldn't respond right now. ${message}`,
        );
      } finally {
        setIsStreaming(false);
        textareaRef.current?.focus();
      }
    },
    [
      activePersonaId,
      appendMessage,
      isStreaming,
      messages,
      summary,
      webSearch,
      updateLastAssistant,
      updateSummary,
    ],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const handlePersonaSwitch = (id: PersonaId) => {
    if (id === activePersonaId) return;
    abortRef.current?.abort();
    setIsStreaming(false);
    setError(null);
    setInput("");
    setActivePersonaId(id);
  };

  const isHitesh = activePersonaId === "hitesh";

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm font-mono text-muted-foreground bg-background">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        loading workspace environment…
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Mobile persona switcher */}
        <div className="flex shrink-0 border-b border-border lg:hidden bg-card/20">
          {personaList.map((p) => {
            const active = p.id === activePersonaId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePersonaSwitch(p.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 border-r border-border/80 px-4 py-3 text-xs font-semibold last:border-r-0 transition-all",
                  active ? "bg-muted/50 text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                style={
                  active
                    ? { borderBottom: `2.5px solid ${p.accent}` }
                    : undefined
                }
              >
                <PersonaAvatar
                  persona={p}
                  size="sm"
                  active={active}
                />
                {p.name.split(" ")[0]}
              </button>
            );
          })}
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_1fr]">
          {/* Sidebar on desktop */}
          <div className="hidden min-h-0 overflow-hidden border-r border-border/80 lg:block">
            <PersonaSidebar
              personas={personaList}
              activeId={activePersonaId}
              onSelect={handlePersonaSwitch}
            />
          </div>

          {/* Main chat interface */}
          <main className="flex min-h-0 flex-col bg-background">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/85 px-4 py-3.5 sm:px-6 bg-card/5 backdrop-blur-xs">
              <div className="flex min-w-0 items-center gap-3">
                <PersonaAvatar persona={persona} size="sm" active />
                <div className="min-w-0">
                  <h2 className="truncate font-display text-sm font-extrabold tracking-tight text-foreground">
                    {persona.name}
                  </h2>
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {persona.role}
                  </p>
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={clearMessages}
                    disabled={messages.length === 0 || isStreaming}
                    aria-label="Clear conversation"
                    className="h-8.5 w-8.5 rounded-sm border-border bg-card/60 transition-all hover:bg-muted/80"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset studio</TooltipContent>
              </Tooltip>
            </header>

            {/* Scrollable message area */}
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6"
            >
              <MessageList
                messages={messages}
                persona={persona}
                isStreaming={isStreaming}
                bottomRef={bottomRef}
              />
            </div>

            {/* Composer */}
            <div className="shrink-0 border-t border-border/80 bg-card/35 px-4 py-4 sm:px-6">
              {error ? (
                <div className="mb-3 rounded-sm border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive" role="alert">
                  ⚠ Error: {error}
                </div>
              ) : null}

              {searchWarning ? (
                <div className="mb-3 rounded-sm border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-500" role="status">
                  ⚠ Warning: {searchWarning}
                </div>
              ) : null}

              {messages.length === 0 ? (
                <div className="mb-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 font-mono flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary animate-spin" />
                    Quick Prompts
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS[activePersonaId].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => void sendMessage(suggestion)}
                        disabled={isStreaming}
                        className={cn(
                          "rounded-sm border border-border bg-card/50 px-3.5 py-1.5 text-left text-xs font-semibold text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50",
                          isHitesh
                            ? "hover:border-primary/40 hover:bg-primary/[0.03] hover:text-primary"
                            : "hover:border-secondary/40 hover:bg-secondary/[0.03] hover:text-secondary"
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="flex gap-2">
                <div
                  className={cn(
                    "flex-1 flex items-end gap-2 rounded-sm border border-border bg-card p-2.5 transition-all duration-200",
                    "focus-within:ring-2",
                    isHitesh
                      ? "focus-within:ring-primary/20 focus-within:border-primary/40"
                      : "focus-within:ring-secondary/20 focus-within:border-secondary/40"
                  )}
                >
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      webSearch
                        ? `Consult ${persona.name.split(" ")[0]} with live search…`
                        : `Consult ${persona.name.split(" ")[0]}…`
                    }
                    rows={1}
                    disabled={isStreaming}
                    className="min-h-9 max-h-28 flex-1 resize-none bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-1 text-sm font-medium"
                  />
                  
                  {/* Search toggle inside composer */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={webSearch ? "default" : "ghost"}
                        size="icon"
                        disabled={isStreaming}
                        onClick={() => setWebSearch((on) => !on)}
                        className={cn(
                          "h-8.5 w-8.5 shrink-0 rounded-sm hover:bg-muted",
                          webSearch && (
                            isHitesh 
                              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                          )
                        )}
                        aria-label="Toggle web search"
                        aria-pressed={webSearch}
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="font-mono text-xs">
                      {webSearch ? "RAG Search Enabled" : "RAG Search Disabled"}
                    </TooltipContent>
                  </Tooltip>
                </div>

                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isStreaming}
                  className="h-[46px] w-[46px] shrink-0 rounded-sm transition-transform active:scale-95"
                  style={{
                    backgroundColor: persona.accent,
                    color: isHitesh ? "#ffffff" : "#0c0f14",
                  }}
                >
                  <ArrowUp className="h-5 w-5" />
                  <span className="sr-only">Send</span>
                </Button>
              </form>

              <Separator className="my-3.5" />

              {/* Status details bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-muted-foreground/80">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-sm", isStreaming ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                    Status: {isStreaming ? "Broadcasting" : "Ready"}
                  </span>
                  <span className="text-border">|</span>
                  <span className="flex items-center gap-1">
                    <BrainCircuit className="h-3 w-3" />
                    Memory: {summary ? "Contextualized" : "Empty"}
                  </span>
                </div>
                <span>Engine: Mistral Large</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
