import { hiteshPersona } from "./hitesh";
import { piyushPersona } from "./piyush";
import type { PersonaId, PersonaProfile } from "./types";

export const personas: Record<PersonaId, PersonaProfile> = {
  hitesh: hiteshPersona,
  piyush: piyushPersona,
};

export const personaList: PersonaProfile[] = [hiteshPersona, piyushPersona];

export function getPersona(id: PersonaId): PersonaProfile {
  return personas[id];
}

export type { PersonaId, PersonaProfile, ChatMessage } from "./types";
