import { mockDb } from "@/features/stores/mock/database";
import { PlayerDocumentSchema, type PlayerDocument } from "./server.model";
import type { PlayerRepository } from "./server.types";

/** Players repository (mock store until MongoDB is wired). */
export const playerRepository: PlayerRepository = {
  async findByEmail(email) {
    const e = email.toLowerCase();
    return [...mockDb.players.values()].find((p) => p.email === e) ?? null;
  },
  async findByChain(chain, address) {
    return (
      [...mockDb.players.values()].find((p) => p.chain === chain && p.chainAddress === address) ??
      null
    );
  },
  async create(data) {
    const record = PlayerDocumentSchema.parse({
      ...data,
      email: data.email?.toLowerCase() ?? null,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
    mockDb.players.set(record.id, record);
    return record;
  },
};

/** Strip private fields before returning to clients. */
export function toPlayer({ passwordHash: _p, ...player }: PlayerDocument) {
  return player;
}
