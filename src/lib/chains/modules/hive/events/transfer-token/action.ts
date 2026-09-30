import { z } from "zod";
import { getHiveClient, type HiveClient } from "../../client";

import {
  HiveAccountSchema,
  SymbolSchema,
  QuantitySchema,
  MetadataSchema,
  SignerSchema,
  ok,
  fail,
  type HiveActionResult,
} from "../../types";

export const TransferTokenInput = z.object({
  signer: SignerSchema.default("keychain"),
  /** Required for the keychain signer: the Hive account signing in the browser. */
  from: HiveAccountSchema.optional(),
  /** Required for the server signer: a configured account alias. */
  alias: z.string().trim().min(1).optional(),
  to: HiveAccountSchema,
  amount: QuantitySchema,
  symbol: SymbolSchema,
  /** Standardized trigger action carried with the transfer. */
  action: z.string().trim().min(1),
  metadata: MetadataSchema,
  client: z.custom<HiveClient>().optional(),
});

export type TransferTokenInput = z.input<typeof TransferTokenInput>;

export type TransferResult = {
  transactionId: string | null;
  layer: 1 | 2;
  signer: "keychain" | "server";
};

/**
 * Transfer HIVE/HBD (Layer 1) or a Hive Engine token (Layer 2).
 *
 * Broadcasting a Layer 2 transfer only proves the custom_json reached Hive.
 * Always confirm execution with `validatePayment` before crediting anything.
 */
export async function transferToken(input: TransferTokenInput): Promise<HiveActionResult<TransferResult>> {
  const parsed = TransferTokenInput.safeParse(input);
  if (!parsed.success) return fail(new Error(parsed.error.issues[0]?.message ?? "Invalid input"));

  const { signer, from, alias, to, amount, symbol, action, metadata } = parsed.data;
  const hive = parsed.data.client ?? getHiveClient();
  const layer: 1 | 2 = isNativeHiveSymbol(symbol) ? 1 : 2;

  try {
    if (signer === "keychain") {
      if (!from) return fail(new Error("A Hive username is required to sign with Keychain"));
      if (!hive.keychain.isAvailable()) return fail(new Error("Hive Keychain not found. Install the extension."));
      const memo = hive.builder.serialize(hive.builder.buildPayload({ action, metadata: metadata ?? null }));
      const result = await hive.keychain.requestTransfer({
        username: from,
        to,
        amount,
        currency: symbol,
        memo,
      });
      return ok({ transactionId: result.transactionId, layer, signer });
    }

    const reference = hive.account(alias ?? "treasury");
    const result =
      layer === 1
        ? await hive.payments.hive.transfer({
            from: reference,
            account: to,
            amount,
            symbol,
            action,
            metadata: metadata ?? null,
          })
        : await hive.payments.engine.transfer({
            from: reference,
            account: to,
            quantity: amount,
            symbol,
            action,
            metadata: metadata ?? null,
          });

    return ok({ transactionId: result.transactionId ?? null, layer, signer });
  } catch (error) {
    return fail(error);
  }
}
