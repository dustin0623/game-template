import type { PendingTransactionDocument } from "./server.model";

export type CreatePendingTransactionInput = Pick<
  PendingTransactionDocument,
  "playerId" | "chain" | "action" | "payload"
>;

export interface PendingTransactionRepository {
  create(data: CreatePendingTransactionInput): Promise<PendingTransactionDocument>;
  findById(id: string): Promise<PendingTransactionDocument | null>;
  /** Atomically claim up to `limit` PENDING rows (oldest first) for a worker. */
  claimBatch(workerId: string, limit: number): Promise<PendingTransactionDocument[]>;
  /** Return a claimed row to PENDING after a retryable failure. */
  release(id: string, error: string): Promise<void>;
  /** Remove a row once its outcome is stored in processed-transactions. */
  remove(id: string): Promise<void>;
}
