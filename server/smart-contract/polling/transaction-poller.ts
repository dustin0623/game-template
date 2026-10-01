import type { PendingTransactionDocument } from "@/lib/modules/pending-transactions/server.model";
import type { PollingContext } from "./context";

export type HandlerResult = { ok: true; txId: string | null; data?: unknown } | { ok: false; error: string };
export type TransactionHandler = (tx: PendingTransactionDocument) => Promise<HandlerResult>;

/** One poll cycle: claim a batch, run the handler, record every outcome. */
export async function pollOnce(ctx: PollingContext, handle: TransactionHandler) {
  const batch = await ctx.pending.claimBatch(ctx.workerId, ctx.batchSize);
  for (const tx of batch) {
    let result: HandlerResult;
    try {
      result = await handle(tx);
    } catch (e) {
      result = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
    if (!result.ok && tx.attempts < ctx.maxAttempts) {
      await ctx.pending.release(tx.id, result.error);
      continue;
    }
    await ctx.processed.create({
      pendingTransactionId: tx.id,
      playerId: tx.playerId,
      chain: tx.chain,
      action: tx.action,
      payload: tx.payload,
      attempts: tx.attempts,
      status: result.ok ? "SUCCESS" : "ERROR",
      txId: result.ok ? result.txId : null,
      result: result.ok ? (result.data ?? null) : null,
      error: result.ok ? null : result.error,
      processedBy: ctx.workerId,
    });
    await ctx.pending.remove(tx.id);
  }
  return batch.length;
}

/** Start polling on an interval; returns a stop function. */
export function startPolling(ctx: PollingContext, handle: TransactionHandler) {
  let running = false;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await pollOnce(ctx, handle);
    } finally {
      running = false;
    }
  }, ctx.intervalMs);
  return () => clearInterval(timer);
}
