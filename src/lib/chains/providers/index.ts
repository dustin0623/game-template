/** Browser-facing auth API. Orchestrates chain providers + server functions. */
import type { ChainProvider } from "@/lib/config/config";
import { walletChallengeFn, walletLoginFn, emailLoginFn, emailSignupFn } from "./auth.functions";
import * as solana from "./solana/sign";
import * as xrpl from "./xrpl/sign";
import { connect as connectHive } from "./hive";
import { sign as signHive } from "./hive/sign";
import type { SolanaWallet } from "@/lib/chains/modules/solana/events/login/types";

export { emailLoginFn, emailSignupFn };
export { SOLANA_WALLETS, isSolanaWalletAvailable } from "./solana/sign";
export type { SolanaWallet, SolanaWalletMeta } from "./solana/sign";

export type WalletLoginOptions = {
  /** Required for Hive: the account name to sign with. */
  hiveUsername?: string;
  /** Which Solana wallet to use: phantom | solflare | backpack | metamask. */
  solanaWallet?: SolanaWallet;
};

/** Full wallet login flow: connect → challenge → sign → verify. */
export async function walletLogin(chain: ChainProvider, options: WalletLoginOptions = {}) {
  const { hiveUsername, solanaWallet = "phantom" } = options;

  const connected = await (chain === "solana"
    ? solana.connect(solanaWallet)
    : chain === "xrpl"
      ? xrpl.connect()
      : connectHive(hiveUsername));

  const { address, publicKey } = connected as { address: string; publicKey?: string };
  const { message, token } = await walletChallengeFn({ data: { chain, address } });

  const { signature } = await (chain === "solana"
    ? solana.sign(address, message, solanaWallet)
    : chain === "xrpl"
      ? xrpl.sign(address, message)
      : signHive(address, message));

  return walletLoginFn({ data: { chain, address, message, token, signature, publicKey } });
}
