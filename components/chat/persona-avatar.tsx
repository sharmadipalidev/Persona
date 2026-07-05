"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { PersonaProfile } from "@/lib/personas/types";

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-14 w-14",
} as const;

interface PersonaAvatarProps {
  persona: PersonaProfile;
  size?: keyof typeof sizeClasses;
  className?: string;
  active?: boolean;
}

export function PersonaAvatar({
  persona,
  size = "md",
  className,
  active,
}: PersonaAvatarProps) {
  return (
    <Avatar
      className={cn(
        sizeClasses[size],
        "shrink-0 border",
        active ? "border-transparent" : "border-border",
        className,
      )}
      style={active ? { boxShadow: `0 0 0 2px ${persona.accent}` } : undefined}
    >
      <AvatarImage src={persona.image} alt={persona.name} />
      <AvatarFallback
        className="text-xs font-bold"
        style={{
          backgroundColor: persona.accentMuted,
          color: persona.accent,
        }}
      >
        {persona.initials}
      </AvatarFallback>
    </Avatar>
  );
}
