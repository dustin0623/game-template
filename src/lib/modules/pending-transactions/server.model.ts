import { z } from "zod";

/** MongoDB collection name for queued external asset operations. */
export const PENDING_TRANSACTIONS_COLLECTION = "pending_transactions";

export const PendingTransactionStatusSchema = z.enum(["PENDING", "PROCESSING"]);

/** A queued operation waiting for the smart-contract worker. */
export const PendingTransactionDocumentSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  chain: z.enum(["hive", "solana", "xrpl"]),
  /** Game operation, e.g. "withdraw", "deposit", "claim-reward". */
  action: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  status: PendingTransactionStatusSchema,
  attempts: z.number().int().nonnegative(),
  /** Worker id holding the claim while PROCESSING. */
  claimedBy: z.string().nullable(),
  claimedAt: z.string().nullable(),
  lastError: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PendingTransactionDocument = z.infer<typeof PendingTransactionDocumentSchema>;
