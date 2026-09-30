import type { ChainProvider } from "@/lib/config/config";
import { mockDb, type PlayerRecord } from "../mock-database";

export const playerRepository = {
  async findByEmail(email: string) {
    const e = email.toLowerCase();
    return [...mockDb.players.values()].find((p) => p.email === e) ?? null;
  },
  async findByChain(chain: ChainProvider, address: string) {
    return (
      [...mockDb.players.values()].find(
        (p) => p.chain === chain && p.chainAddress === address,
      ) ?? null
    );
  },
  async create(data: Omit<PlayerRecord, "id" | "createdAt">) {
    const record: PlayerRecord = {
      ...data,
      email: data.email?.toLowerCase() ?? null,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    mockDb.players.set(record.id, record);
    return record;
  },
};

export function toPlayer({ passwordHash: _p, ...player }: PlayerRecord) {
  return player;
}
