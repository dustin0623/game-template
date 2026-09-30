/** Public API of the Solana chain module. */
export {
  connectSolana,
  signSolanaLogin,
  verifySolanaSignature,
  isSolanaWalletAvailable,
  setMetaMaskWallet,
  SOLANA_WALLETS,
} from "./events/login/action";
export { SolanaWalletSchema } from "./events/login/types";
export type { SolanaWallet, SolanaWalletMeta } from "./events/login/types";
