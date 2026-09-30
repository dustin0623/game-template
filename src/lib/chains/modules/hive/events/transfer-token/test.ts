import { describe, it, expect, vi } from "vitest";
import { transferToken } from "./action";
import type { HiveClient } from "../../client";

function mockClient(available = true) {
  const requestTransfer = vi.fn().mockResolvedValue({ success: true, transactionId: "tx-keychain", raw: {} });
  const hiveTransfer = vi.fn().mockResolvedValue({ success: true, transactionId: "tx-l1", raw: {} });
  const engineTransfer = vi.fn().mockResolvedValue({ success: true, transactionId: "tx-l2", raw: {} });
  const client = {
    keychain: { isAvailable: () => available, requestTransfer },
    builder: {
      buildPayload: (p: unknown) => p,
      serialize: (p: unknown) => JSON.stringify(p),
    },
    account: (alias: string) => ({ alias }),
    payments: { hive: { transfer: hiveTransfer }, engine: { transfer: engineTransfer } },
  } as unknown as HiveClient;
  return { client, requestTransfer, hiveTransfer, engineTransfer };
}

describe("transferToken", () => {
  it("sends a Layer 1 transfer through Keychain", async () => {
    const { client, requestTransfer } = mockClient();
    const res = await transferToken({ from: "alice", to: "bob", amount: "1.000", symbol: "HIVE", action: "buy", client });
    expect(res).toMatchObject({ ok: true, data: { transactionId: "tx-keychain", layer: 1, signer: "keychain" } });
    expect(requestTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ username: "alice", to: "bob", currency: "HIVE", amount: "1.000" }),
    );
  });

  it("routes a Hive Engine symbol as Layer 2", async () => {
    const { client } = mockClient();
    const res = await transferToken({ from: "alice", to: "bob", amount: "5.000", symbol: "SCRAP", action: "buy", client });
    expect(res.ok && res.data.layer).toBe(2);
  });

  it("signs Layer 1 server-side with the treasury alias", async () => {
    const { client, hiveTransfer } = mockClient();
    const res = await transferToken({
      signer: "server",
      to: "bob",
      amount: "2.000",
      symbol: "HBD",
      action: "reward",
      client,
    });
    expect(res).toMatchObject({ ok: true, data: { transactionId: "tx-l1", signer: "server" } });
    expect(hiveTransfer).toHaveBeenCalledWith(expect.objectContaining({ from: { alias: "treasury" } }));
  });

  it("signs Layer 2 server-side", async () => {
    const { client, engineTransfer } = mockClient();
    const res = await transferToken({ signer: "server", to: "bob", amount: "9.000", symbol: "SCRAP", action: "payout", client });
    expect(res.ok && res.data.transactionId).toBe("tx-l2");
    expect(engineTransfer).toHaveBeenCalledWith(expect.objectContaining({ quantity: "9.000", symbol: "SCRAP" }));
  });

  it("requires a username for the Keychain signer", async () => {
    const { client } = mockClient();
    const res = await transferToken({ to: "bob", amount: "1.000", symbol: "HIVE", action: "buy", client });
    expect(res.ok).toBe(false);
  });

  it("fails clearly when Keychain is missing", async () => {
    const { client } = mockClient(false);
    const res = await transferToken({ from: "alice", to: "bob", amount: "1.000", symbol: "HIVE", action: "buy", client });
    expect(res).toMatchObject({ ok: false });
  });

  it("rejects a non-decimal amount", async () => {
    const { client } = mockClient();
    const res = await transferToken({ from: "alice", to: "bob", amount: "lots", symbol: "HIVE", action: "buy", client });
    expect(res.ok).toBe(false);
  });

  it("surfaces broadcast failures", async () => {
    const { client } = mockClient();
    (client.payments.hive.transfer as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("no key"));
    const res = await transferToken({ signer: "server", to: "bob", amount: "1.000", symbol: "HIVE", action: "x", client });
    expect(res).toMatchObject({ ok: false, error: "no key" });
  });
});
