import type { PlayerDocument } from "@/lib/modules/players/server.model";

/** In-memory dev database. Only repositories in src/lib/modules/* may touch it. */
export const mockDb = {
  players: new Map<string, PlayerDocument>(),
};
