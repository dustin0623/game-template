import { z } from "zod";
import { PendingTransactionDocumentSchema } from "@/lib/modules/pending-transactions/server.model";

/** MongoDB collection name for finished worker outcomes. */
export const PROCESSED_TRANSACTIONS_COLLECTION = "processed_transactions";

export const ProcessedTransactionStatusSchema = z.enum(["SUCCESS", "ERROR"]);

/** Final, immutable record of a worker outcome (success or failure). */
export const ProcessedTransactionDocumentSchema = PendingTransactionDocumentSchema.pick({
  playerId: true,
  chain: true,
  action: true,
  payload: true,
  attempts: true,
}).extend({
  id: z.string(),
  pendingTransactionId: z.string(),
  status: ProcessedTransactionStatusSchema,
  txId: z.string().nullable(),
  result: z.unknown().nullable(),
  error: z.string().nullable(),
  processedBy: z.string(),
  processedAt: z.string(),
});
export type ProcessedTransactionDocument = z.infer<typeof ProcessedTransactionDocumentSchema>;
