import { describe, expect, it } from "vitest";
import { createProcessor, mockSuccess } from "./index";
import type { PendingTransactionDocument } from "@/lib/modules/pending-transactions/server.model";

const tx = { id: "abcdef123456", chain: "hive", action: "withdraw" } as PendingTransactionDocument;

describe("processor", () => {
  it("routes by chain:action, then action, then fallback", async () => {
    const p = createProcessor({ "hive:withdraw": async () => ({ ok: true, txId: "x" }) });
    expect(await p(tx)).toEqual({ ok: true, txId: "x" });
    expect((await createProcessor({}, mockSuccess)(tx)).ok).toBe(true);
  });
  it("fails when no handler matches", async () => {
    expect(await createProcessor({})(tx)).toEqual({ ok: false, error: "No handler for hive:withdraw" });
  });
});
