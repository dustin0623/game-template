import { z } from "zod";
import { getHiveClient, type HiveClient } from "../../client";
import {
  HiveAccountSchema,
  SymbolSchema,
  QuantitySchema,
  TransactionIdSchema,
  ok,
  fail,
  type HiveActionResult,
} from "../../types";
import type { PaymentValidationResult } from "hivexph-sdk";

export const ValidatePaymentInput = z.object({
  transactionId: TransactionIdSchema,
  expected: z
    .object({
      from: HiveAccountSchema.optional(),
      account: HiveAccountSchema.optional(),
      symbol: SymbolSchema.optional(),
      quantity: QuantitySchema.optional(),
      action: z.string().trim().min(1).optional(),
    })
    .optional(),
  client: z.custom<HiveClient>().optional(),
});

export type ValidatePaymentInput = z.input<typeof ValidatePaymentInput>;

/**
 * Confirm a payment exists, executed (Hive Engine included) and matches what
 * the game expected. The transaction worker MUST call this before crediting
 * a deposit or finalizing a withdrawal.
 */
export async function validatePayment(
  input: ValidatePaymentInput,
): Promise<HiveActionResult<PaymentValidationResult>> {
  const parsed = ValidatePaymentInput.safeParse(input);
  if (!parsed.success) return fail(new Error(parsed.error.issues[0]?.message ?? "Invalid input"));

  const { transactionId, expected } = parsed.data;
  const hive = parsed.data.client ?? getHiveClient();

  try {
    return ok(await hive.payments.validate({ transactionId, ...(expected ? { expected } : {}) }));
  } catch (error) {
    return fail(error);
  }
}
