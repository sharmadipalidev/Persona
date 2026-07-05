"use client";

import type { RefObject } from "react";
import { Loader2 } from "lucide-react";
import { PersonaAvatar } from "@/components/chat/persona-avatar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { cn } from "@/lib/utils";
import type { ChatMessage, PersonaProfile } from "@/lib/personas/types";

interface MessageBubbleProps {
  message: ChatMessage;
  persona: PersonaProfile;
  isStreaming?: boolean;
}

export function MessageBubble({
  message,
  persona,
  isStreaming,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isHitesh = persona.id === "hitesh";
  const isEmptyAssistant =
    !isUser && !message.content.trim() && isStreaming;

  if (isEmptyAssistant) {
    return (
      <div className="flex w-full items-center justify-start gap-3 py-2">
        <PersonaAvatar persona={persona} size="sm" />
        <span className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/30 border border-border/40 px-2.5 py-1 rounded-sm animate-pulse">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          compiling response…
        </span>
      </div>
    );
  }

  if (!isUser && !message.content.trim()) return null;

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser ? (
        <PersonaAvatar persona={persona} size="sm" className="mt-1 shrink-0" />
      ) : null}

      <div
        className={cn(
          "max-w-[85%] sm:max-w-[70%] rounded-xl border px-4 py-3 text-[13px] leading-relaxed shadow-sm transition-all",
          isUser
            ? "border-border bg-muted/40 text-foreground rounded-tr-none"
            : "border-border/80 bg-card text-card-foreground rounded-tl-none",
        )}
        style={
          !isUser
            ? { borderLeftWidth: 3, borderLeftColor: persona.accent }
            : undefined
        }
      >
        {/* Sender metadata info */}
        <div className="flex items-center gap-2 mb-1.5 select-none">
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider font-mono",
              isUser
                ? "text-muted-foreground/80"
                : isHitesh
                  ? "text-primary"
                  : "text-secondary"
            )}
          >
            {isUser ? "You" : persona.name}
          </span>
          <span className="text-[9px] text-muted-foreground/40 font-mono">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {isUser ? (
          <p className="whitespace-pre-wrap font-sans font-medium text-foreground/90">{message.content}</p>
        ) : (
          <div className="font-sans font-normal text-foreground/90">
            <MarkdownContent content={message.content} />
            {isStreaming && message.content ? (
              <span
                className="ml-1 inline-block h-3.5 w-1 animate-pulse"
                style={{ backgroundColor: persona.accent }}
                aria-hidden
              />
            ) : null}
          </div>
        )}
      </div>

      {isUser ? (
        <Avatar className="mt-1 h-8 w-8 shrink-0 rounded-full border border-border/80 shadow-sm">
          <AvatarFallback className="rounded-full bg-secondary/15 text-[10px] font-bold text-secondary">
            ME
          </AvatarFallback>
        </Avatar>
      ) : null}
    </div>
  );
}

interface MessageListProps {
  messages: ChatMessage[];
  persona: PersonaProfile;
  isStreaming: boolean;
  bottomRef: RefObject<HTMLDivElement | null>;
}

export function MessageList({
  messages,
  persona,
  isStreaming,
  bottomRef,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex min-h-[450px] flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="relative">
          <PersonaAvatar persona={persona} size="lg" active />
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border shadow-sm text-[10px]">
            🎓
          </span>
        </div>
        <div className="max-w-sm space-y-2">
          <h3 className="font-display text-base font-extrabold tracking-tight text-foreground sm:text-lg">
            Consult {persona.name}
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground font-medium">
            {persona.id === "hitesh"
              ? "Get production-grade guidance on React, system design, or engineering paths. Simple Hinglish analogies, coffee/chai style."
              : "Ask coding challenges, backend paradigms, microservices, or interview prep. Fast, direct, zero fluff."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col justify-end">
      <div className="w-full space-y-4 py-6">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            persona={persona}
            isStreaming={
              isStreaming &&
              index === messages.length - 1 &&
              message.role === "assistant"
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
