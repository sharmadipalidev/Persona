"use client";

import { 
  Plus, 
  ChevronRight
} from "lucide-react";
import { PersonaAvatar } from "@/components/chat/persona-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PersonaProfile } from "@/lib/personas/types";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

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
        "group relative w-full text-left transition-all duration-200 rounded-lg py-2 px-2.5",
        active ? "bg-muted/15 text-foreground" : "hover:bg-muted/10 text-muted-foreground hover:text-foreground",
      )}
      aria-pressed={active}
      aria-label={`Switch to ${persona.name}`}
    >
      <div className="flex items-center gap-3">
        <PersonaAvatar persona={persona} size="sm" active={active} />
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <span className="truncate text-xs font-semibold tracking-wide">
              {persona.name.split(" ")[0]}
            </span>
            {active && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <span className="block truncate text-[10px] text-muted-foreground/80 font-medium">
            {persona.id === "hitesh" ? "Chai aur Code ☕" : "Build Devs 🚀"}
          </span>
        </div>
        
        <ChevronRight className={cn(
          "h-3 w-3 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0",
          active && "opacity-60 translate-x-0 text-primary"
        )} />
      </div>
    </button>
  );
}

interface PersonaSidebarProps {
  personas: PersonaProfile[];
  activeId: string;
  onSelect: (id: PersonaProfile["id"]) => void;
  onClearChat: () => void;
  messagesCount: number;
}

export function PersonaSidebar({
  personas,
  activeId,
  onSelect,
  onClearChat,
  messagesCount,
}: PersonaSidebarProps) {
  return (
    <aside className="flex h-full flex-col bg-[#0f0f10] text-[#a1a1aa] border-r border-[#1a1a1c] p-4 select-none">
      {/* Top Header Logo */}
      <div className="flex items-center justify-start px-1 mb-5">
        <div className="flex items-center gap-2 text-white">
          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-black">
            M
          </div>
          <span className="font-display text-sm font-extrabold tracking-tight">
            MentorStudio
          </span>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="space-y-1 mb-6">
        <button
          onClick={onClearChat}
          disabled={messagesCount === 0}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#222225] bg-[#151518] px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-[#1a1a1e] disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          New chat
        </button>




      </div>

      {/* Recents / Mentor Switcher Section */}
      <div className="flex-1 space-y-3">
        <p className="px-3 text-[9px] font-bold uppercase tracking-wider text-[#52525b]">
          Mentors
        </p>
        <div className="space-y-1 px-1">
          {personas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              active={persona.id === activeId}
              onSelect={() => onSelect(persona.id)}
            />
          ))}
        </div>
      </div>




    </aside>
  );
}
