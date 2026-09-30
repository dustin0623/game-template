import type { Player } from "@/features/types/auth.types";

export type PlayerRecord = Player & { passwordHash: string | null };

/** In-memory dev database. Replace with MongoDB repositories in production. */
export const mockDb = {
  players: new Map<string, PlayerRecord>(),
};
