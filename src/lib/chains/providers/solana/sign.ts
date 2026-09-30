/** Browser: Solana connect + login signing, delegated to the module login event. */
export {
  connectSolana as connect,
  signSolanaLogin as sign,
  isSolanaWalletAvailable,
  SOLANA_WALLETS,
} from "@/lib/chains/modules/solana/events/login/action";
export type { SolanaWallet, SolanaWalletMeta } from "@/lib/chains/modules/solana/events/login/types";
