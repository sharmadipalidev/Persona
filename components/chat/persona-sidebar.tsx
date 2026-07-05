"use client";

import { ExternalLink, GitBranch, Globe } from "lucide-react";
import { PersonaAvatar } from "@/components/chat/persona-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PersonaProfile } from "@/lib/personas/types";

interface PersonaCardProps {
  persona: PersonaProfile;
  active: boolean;
  onSelect: () => void;
}

export function PersonaCard({ persona, active, onSelect }: PersonaCardProps) {
  const isHitesh = persona.id === "hitesh";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative w-full text-left transition-all duration-200",
        "border-b border-border/60 last:border-b-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
        active ? "bg-muted/40" : "hover:bg-muted/15",
      )}
      aria-pressed={active}
      aria-label={`Switch to ${persona.name}`}
    >
      <div className="flex items-start gap-3.5 p-5">
        <PersonaAvatar persona={persona} size="md" active={active} />

        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={cn(
                "font-display text-sm font-semibold tracking-tight transition-colors",
                active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
              )}
            >
              {persona.name}
            </h3>
            {active ? (
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider animate-pulse"
                style={{
                  backgroundColor: persona.accentMuted,
                  color: persona.accent,
                }}
              >
                Streaming
              </span>
            ) : null}
          </div>

          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/90 font-medium">
            {persona.tagline}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {persona.topics.slice(0, 3).map((topic) => (
              <Badge
                key={topic}
                variant="outline"
                className={cn(
                  "border-border/60 px-2 py-0 text-[10px] font-medium tracking-wide",
                  active
                    ? isHitesh
                      ? "bg-primary/5 text-primary border-primary/20"
                      : "bg-secondary/5 text-secondary border-secondary/20"
                    : "bg-card/40 text-muted-foreground"
                )}
              >
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Indication bar on the left */}
      <div
        className={cn(
          "absolute bottom-0 left-0 top-0 w-1 transition-all duration-300",
          active ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0",
        )}
        style={{ backgroundColor: persona.accent }}
      />
    </button>
  );
}

interface PersonaSidebarProps {
  personas: PersonaProfile[];
  activeId: string;
  onSelect: (id: PersonaProfile["id"]) => void;
}

export function PersonaSidebar({
  personas,
  activeId,
  onSelect,
}: PersonaSidebarProps) {
  return (
    <aside className="flex h-full flex-col bg-card/20">
      <div className="border-b border-border/80 px-5 py-5 bg-card/10">
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground/80">
          Studio Roster
        </p>
        <h2 className="mt-1 font-display text-base font-extrabold tracking-tight text-foreground">
          Choose Mentor
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {personas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            active={persona.id === activeId}
            onSelect={() => onSelect(persona.id)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2.5 border-t border-border/80 p-5 bg-card/15">
        {(() => {
          const active = personas.find((p) => p.id === activeId);
          return (
            <>
              {active?.website ? (
                <a
                  href={active.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Official site
                  <ExternalLink className="h-3 w-3 opacity-60 ml-auto" />
                </a>
              ) : null}
              {active?.github ? (
                <a
                  href={active.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  GitHub repository
                  <ExternalLink className="h-3 w-3 opacity-60 ml-auto" />
                </a>
              ) : null}
            </>
          );
        })()}
      </div>
    </aside>
  );
}
