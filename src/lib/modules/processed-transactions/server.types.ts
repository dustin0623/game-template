import type { ProcessedTransactionDocument } from "./server.model";

export type CreateProcessedTransactionInput = Omit<
  ProcessedTransactionDocument,
  "id" | "processedAt"
>;

export interface ProcessedTransactionRepository {
  create(data: CreateProcessedTransactionInput): Promise<ProcessedTransactionDocument>;
  findByPendingId(pendingTransactionId: string): Promise<ProcessedTransactionDocument | null>;
  findByPlayer(playerId: string): Promise<ProcessedTransactionDocument[]>;
}
