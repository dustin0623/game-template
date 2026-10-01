import { mockDb } from "@/features/stores/mock/database";
import { ProcessedTransactionDocumentSchema } from "./server.model";
import type { ProcessedTransactionRepository } from "./server.types";

/** Processed transactions repository (mock store until MongoDB is wired). */
export const processedTransactionRepository: ProcessedTransactionRepository = {
  async create(data) {
    const record = ProcessedTransactionDocumentSchema.parse({
      ...data,
      id: crypto.randomUUID(),
      processedAt: new Date().toISOString(),
    });
    mockDb.processedTransactions.set(record.id, record);
    return record;
  },
  async findByPendingId(pendingTransactionId) {
    return (
      [...mockDb.processedTransactions.values()].find(
        (t) => t.pendingTransactionId === pendingTransactionId,
      ) ?? null
    );
  },
  async findByPlayer(playerId) {
    return [...mockDb.processedTransactions.values()]
      .filter((t) => t.playerId === playerId)
      .sort((a, b) => b.processedAt.localeCompare(a.processedAt));
  },
};
