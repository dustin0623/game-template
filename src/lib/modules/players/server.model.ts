import { z } from "zod";
import { PlayerSchema } from "@/features/types/auth.types";

/** MongoDB collection name for players. */
export const PLAYERS_COLLECTION = "players";

/** Stored player document (public Player + private fields). */
export const PlayerDocumentSchema = PlayerSchema.extend({
  passwordHash: z.string().nullable(),
});
export type PlayerDocument = z.infer<typeof PlayerDocumentSchema>;
