import type { PendingTransactionDocument } from "@/lib/modules/pending-transactions/server.model";
import type { HandlerResult, TransactionHandler } from "../polling/transaction-poller";

/**
 * Action router: maps a pending transaction's `chain:action` to the code that
 * executes it. The same router runs in dev (mock store) and production.
 */
export type ActionHandler = (tx: PendingTransactionDocument) => Promise<HandlerResult>;
export type ActionRegistry = Record<string, ActionHandler>;

/** Mock handler: succeeds instantly with a fake tx id (dev / mock mode only). */
export const mockSuccess: ActionHandler = async (tx) => ({
  ok: true,
  txId: `mock-${tx.id.slice(0, 8)}`,
  data: { mock: true },
});

export function createProcessor(registry: ActionRegistry, fallback?: ActionHandler): TransactionHandler {
  return async (tx) => {
    const handler = registry[`${tx.chain}:${tx.action}`] ?? registry[tx.action] ?? fallback;
    if (!handler) return { ok: false, error: `No handler for ${tx.chain}:${tx.action}` };
    return handler(tx);
  };
}

/** Live actions are registered here as they are implemented (e.g. "hive:withdraw"). */
export const liveRegistry: ActionRegistry = {};
