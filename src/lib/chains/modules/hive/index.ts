/**
 * Public API of the Hive chain module.
 *
 * Game code imports from here only — never from the SDK or from deep paths.
 */
export { getHiveClient, setHiveClient, type HiveClient } from "./client";

export * from "./types";

export { signHiveLogin, verifyHiveSignature, recoverHivePublicKey, getHiveAccountKeys } from "./events/login/action";

export { getTokenBalance, GetTokenBalanceInput, type TokenBalance } from "./events/get-token-balance/action";
export { transferToken, TransferTokenInput, type TransferResult } from "./events/transfer-token/action";
export {
  broadcastCustomJson,
  BroadcastCustomJsonInput,
  type BroadcastResult,
} from "./events/broadcast-custom-json/action";
export { getTransaction, GetTransactionInput } from "./events/get-transaction/action";
export { validatePayment, ValidatePaymentInput } from "./events/validate-payment/action";
