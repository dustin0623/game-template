import type { ChainProvider } from "@/lib/config/config";
import type { PlayerDocument } from "./server.model";

export type CreatePlayerInput = Omit<PlayerDocument, "id" | "createdAt">;

export interface PlayerRepository {
  findByEmail(email: string): Promise<PlayerDocument | null>;
  findByChain(chain: ChainProvider, address: string): Promise<PlayerDocument | null>;
  create(data: CreatePlayerInput): Promise<PlayerDocument>;
}
