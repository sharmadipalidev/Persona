"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { 
  ArrowUp, 
  BrainCircuit, 
  Sparkles, 
  Loader2, 
  Code, 
  BookOpen, 
  Network 
} from "lucide-react";
import { PersonaAvatar } from "@/components/chat/persona-avatar";
import { MessageList } from "@/components/chat/message-list";
import { PersonaSidebar } from "@/components/chat/persona-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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

const CARDS_SUGGESTIONS: Record<PersonaId, { title: string; desc: string; query: string; icon: any }[]> = {
  hitesh: [
    {
      title: "MERN Framework",
      desc: "Learn structure and steps of MERN stack in Hinglish.",
      query: "How do I start MERN from scratch?",
      icon: Code
    },
    {
      title: "Placements Guide",
      desc: "Placements roadmap and DSA coding practices.",
      query: "DSA roadmap for placements?",
      icon: BookOpen
    },
    {
      title: "Web Services",
      desc: "REST APIs explained simply with real analogies.",
      query: "Explain REST API simply",
      icon: Network
    }
  ],
  piyush: [
    {
      title: "Production RAG",
      desc: "Understand retrieval-augmented generation backend flow.",
      query: "How does RAG work in production?",
      icon: Code
    },
    {
      title: "Docker Orchestration",
      desc: "Docker vs Kubernetes comparisons for modern startups.",
      query: "Docker vs Kubernetes for a startup?",
      icon: BookOpen
    },
    {
      title: "System Design",
      desc: "High-level design guide for a scalable URL shortener.",
      query: "System design for a URL shortener",
      icon: Network
    }
  ],
  nikhil: [
    {
      title: "Drizzle Schema",
      desc: "Database modeling with Drizzle ORM and migrations.",
      query: "Explain database schemas in Drizzle ORM",
      icon: Code
    },
    {
      title: "Next.js Routing",
      desc: "Next.js App Router folders and optimal structures.",
      query: "Clean folder structure for Next.js App Router",
      icon: BookOpen
    },
    {
      title: "Micro-SaaS Stack",
      desc: "Indie building and shipping micro-SaaS stacks fast.",
      query: "Best tech stack to ship micro-SaaS fast",
      icon: Network
    }
  ]
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
      <div className="flex flex-1 items-center justify-center text-xs font-mono text-muted-foreground bg-background">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Initializing studio environment…
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-0 flex-1 flex-row">
        
        {/* Left Sidebar - Always dark (like the image) */}
        <div className="hidden min-h-0 overflow-hidden lg:block w-[260px] shrink-0">
          <PersonaSidebar
            personas={personaList}
            activeId={activePersonaId}
            onSelect={handlePersonaSwitch}
            onClearChat={clearMessages}
            messagesCount={messages.length}
          />
        </div>

        {/* Main Content Workspace - Dynamic light/dark (light bg by default matching the image) */}
        <main className="flex min-h-0 flex-1 flex-col bg-background/95 transition-colors duration-300">
          
          {/* Main workspace header bar */}
          <header className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3 sm:px-6 bg-card/40 backdrop-blur-md">
            
            {/* Left: Header area */}
            <div className="flex items-center gap-2">
              {/* Mobile/Tablet switch selector */}
              <div className="flex items-center gap-1 lg:hidden">
                {personaList.map((p) => {
                  const active = p.id === activePersonaId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handlePersonaSwitch(p.id)}
                      className={cn(
                        "text-[10px] font-bold py-1 px-2.5 rounded-md border transition-all",
                        active 
                          ? "bg-primary border-primary/20 text-black shadow-sm" 
                          : "bg-card/40 border-border/40 text-muted-foreground"
                      )}
                    >
                      {p.name.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>

          {/* Scrollable messages or Center Input page */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 md:px-8">
            {messages.length === 0 ? (
              /* Landing State exactly resembling the image */
              <div className="flex min-h-full flex-col justify-center items-center py-10 max-w-[840px] mx-auto space-y-12">
                
                {/* Hero greeting */}
                <div className="text-center space-y-2 select-none">
                  <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    {activePersonaId === "nikhil" ? "Hello Pineapples" : "hey everyone"}
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-lg mx-auto font-medium pt-1.5">
                    Your personal AI mentor powered by {persona.name.split(" ")[0]} AI
                  </p>
                </div>

                {/* Floating Input Composer - Center style matching the image */}
                <div className="w-full max-w-[620px] rounded-xl border border-border/80 bg-card p-3 shadow-md">
                  <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Ask anything to ${persona.name.split(" ")[0]}…`}
                      rows={1}
                      disabled={isStreaming}
                      className="min-h-10 max-h-28 flex-1 resize-none bg-transparent border-0 outline-none focus:outline-none ring-0 focus:ring-0 px-2 py-1 text-sm font-medium text-foreground placeholder:text-muted-foreground"
                    />
                    
                    {/* Bottom controls of the input card */}
                    <div className="flex items-center justify-end pt-0.5">
                      {/* Right action: Send button (black button in image) */}
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isStreaming}
                        className="h-8 w-8 rounded-lg bg-black text-white hover:bg-black/90 dark:bg-primary dark:text-black dark:hover:bg-primary/95 shadow transition-transform active:scale-95"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Bottom suggestion columns with Lime-Green highlight icons (EchoAI style) */}
                <div className="w-full max-w-[620px] grid grid-cols-1 md:grid-cols-3 gap-4">
                  {CARDS_SUGGESTIONS[activePersonaId].map((card) => {
                    const IconComp = card.icon;
                    return (
                      <button
                        key={card.title}
                        type="button"
                        onClick={() => void sendMessage(card.query)}
                        disabled={isStreaming}
                        className="flex flex-col items-start text-left p-4 rounded-xl border border-border bg-card/60 hover:bg-card hover:-translate-y-1 transition-all duration-200 shadow-sm"
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mb-3">
                          <IconComp className="h-4 w-4 text-black" />
                        </div>
                        <h4 className="text-xs font-bold text-foreground mb-1">
                          {card.title}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                          {card.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

              </div>
            ) : (
              /* Active Chat Message list */
              <div className="max-w-[800px] mx-auto w-full">
                <MessageList
                  messages={messages}
                  persona={persona}
                  isStreaming={isStreaming}
                  bottomRef={bottomRef}
                />
              </div>
            )}
          </div>

          {/* Active Chat bottom pinned composer card */}
          {messages.length > 0 && (
            <div className="shrink-0 border-t border-border/60 bg-card/30 backdrop-blur-md px-4 py-4 sm:px-6 md:px-8">
              {error ? (
                <div className="mb-3 rounded-md border border-destructive/20 bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive" role="alert">
                  ⚠ Error: {error}
                </div>
              ) : null}

              {searchWarning ? (
                <div className="mb-3 rounded-md border border-amber-500/20 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-500" role="status">
                  ⚠ Warning: {searchWarning}
                </div>
              ) : null}

              <div className="max-w-[700px] mx-auto flex gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-xl border border-border/80 bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask ${persona.name.split(" ")[0]}…`}
                    rows={1}
                    disabled={isStreaming}
                    className="min-h-9 max-h-24 flex-1 resize-none bg-transparent border-0 outline-none focus:outline-none ring-0 focus:ring-0 px-2 py-1.5 text-sm font-medium text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isStreaming}
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl bg-black text-white hover:bg-black/90 dark:bg-primary dark:text-black dark:hover:bg-primary/95 shadow transition-transform active:scale-95"
                >
                  <ArrowUp className="h-4.5 w-4.5" />
                </Button>
              </div>

              {/* Status details bar */}
              <div className="max-w-[700px] mx-auto flex items-center justify-between pt-3 mt-3 border-t border-border/40 text-[9px] font-mono text-muted-foreground/60 select-none">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    {isStreaming ? "broadcasting" : "ready"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <BrainCircuit className="h-3 w-3" />
                    Memory: {summary ? "Contextual" : "Empty"}
                  </span>
                </div>
                <span>Engine: Mistral Large</span>
              </div>
            </div>
          )}

        </main>
      </div>
    </TooltipProvider>
  );
}
