import { describe, expect, it } from "vitest";
import { mockDb } from "@/features/stores/mock/database";
import { createPollingContext } from "./context";
import { pollOnce } from "./transaction-poller";

describe("transaction poller (mock store)", () => {
  it("moves successful and exhausted transactions to processed", async () => {
    const ctx = createPollingContext({ maxAttempts: 1 });
    const ok = await ctx.pending.create({ playerId: "p1", chain: "hive", action: "withdraw", payload: {} });
    const bad = await ctx.pending.create({ playerId: "p1", chain: "hive", action: "withdraw", payload: {} });

    await pollOnce(ctx, async (tx) =>
      tx.id === ok.id ? { ok: true, txId: "abc" } : { ok: false, error: "boom" },
    );

    expect(mockDb.pendingTransactions.size).toBe(0);
    expect((await ctx.processed.findByPendingId(ok.id))?.status).toBe("SUCCESS");
    expect((await ctx.processed.findByPendingId(bad.id))?.error).toBe("boom");
  });

  it("releases retryable failures back to PENDING", async () => {
    const ctx = createPollingContext({ maxAttempts: 3 });
    const tx = await ctx.pending.create({ playerId: "p2", chain: "solana", action: "claim", payload: {} });
    await pollOnce(ctx, async () => ({ ok: false, error: "rpc down" }));
    const row = await ctx.pending.findById(tx.id);
    expect(row?.status).toBe("PENDING");
    expect(row?.attempts).toBe(1);
  });
});
