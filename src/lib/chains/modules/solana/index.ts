/** Public API of the Solana chain module. Mainnet only. */
export { getSolanaClient, setSolanaClient, resolveSolanaEndpoint, type SolanaClient } from "./client";

export * from "./types";

export {
  connectSolana,
  signSolanaLogin,
  verifySolanaSignature,
  isSolanaWalletAvailable,
  getInjectedSolanaProvider,
  setMetaMaskWallet,
  SOLANA_WALLETS,
} from "./events/login/action";
export { SolanaWalletSchema } from "./events/login/types";
export type { SolanaWallet, SolanaWalletMeta } from "./events/login/types";

export {
  getTokenBalance,
  GetTokenBalanceInput,
  type SolanaTokenBalance,
} from "./events/get-token-balance/action";
export {
  getTransaction,
  GetTransactionInput,
  type SolanaTransactionResult,
  type SolanaTransfer,
} from "./events/get-transaction/action";
export {
  transferToken,
  TransferTokenInput,
  type SolanaTransferResult,
} from "./events/transfer-token/action";
export {
  validatePayment,
  ValidatePaymentInput,
  type PaymentValidationResult,
} from "./events/validate-payment/action";
