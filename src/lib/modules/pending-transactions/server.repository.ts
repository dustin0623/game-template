import { mockDb } from "@/features/stores/mock/database";
import { PendingTransactionDocumentSchema } from "./server.model";
import type { PendingTransactionRepository } from "./server.types";

const now = () => new Date().toISOString();

/** Pending transactions repository (mock store until MongoDB is wired). */
export const pendingTransactionRepository: PendingTransactionRepository = {
  async create(data) {
    const ts = now();
    const record = PendingTransactionDocumentSchema.parse({
      ...data,
      id: crypto.randomUUID(),
      status: "PENDING",
      attempts: 0,
      claimedBy: null,
      claimedAt: null,
      lastError: null,
      createdAt: ts,
      updatedAt: ts,
    });
    mockDb.pendingTransactions.set(record.id, record);
    return record;
  },
  async findById(id) {
    return mockDb.pendingTransactions.get(id) ?? null;
  },
  async claimBatch(workerId, limit) {
    const ts = now();
    const batch = [...mockDb.pendingTransactions.values()]
      .filter((t) => t.status === "PENDING")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, limit);
    for (const t of batch) {
      Object.assign(t, {
        status: "PROCESSING",
        claimedBy: workerId,
        claimedAt: ts,
        attempts: t.attempts + 1,
        updatedAt: ts,
      });
    }
    return batch.map((t) => ({ ...t }));
  },
  async release(id, error) {
    const t = mockDb.pendingTransactions.get(id);
    if (!t) return;
    Object.assign(t, {
      status: "PENDING",
      claimedBy: null,
      claimedAt: null,
      lastError: error,
      updatedAt: now(),
    });
  },
  async remove(id) {
    mockDb.pendingTransactions.delete(id);
  },
};
