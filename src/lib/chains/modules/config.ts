/**
 * Chain-specific configuration.
 *
 * `src/lib/config/config.ts` holds APPLICATION configuration.
 * This file holds everything that is specific to a blockchain: endpoints,
 * token symbols, precisions, application ids and the NAMES of the server-only
 * environment variables used for signing.
 *
 * Never put secret values here — only environment variable names. Keys are
 * resolved lazily, server-side, by the chain module at signing time.
 */

/** Server-only env var names. Values are read inside server code only. */
export const chainEnv = {
  hive: {
    /** Optional RPC endpoint override. */
    endpoint: "HIVE_RPC_ENDPOINT",
    /** Treasury account name + active key (used by the transaction worker). */
    treasuryAccount: "HIVE_TREASURY_ACCOUNT",
    treasuryKey: "HIVE_TREASURY_ACTIVE_KEY",
  },
} as const;

export const hiveChainConfig = {
  /**
   * RPC endpoint / beacon URL: the SDK ships sane defaults
   * (https://api.hive.blog + PeakD beacon). Only set these when overriding.
   * `chainEnv.hive.endpoint` names the env var for a runtime override.
   */
  /** custom_json id used for this app's standardized game actions. The SDK
   * requires one — no default exists there. */
  applicationId: "lovable-game",
  /** Backend signing accounts, referenced by alias. */
  accounts: {
    treasury: {
      accountEnv: chainEnv.hive.treasuryAccount,
      keyEnv: chainEnv.hive.treasuryKey,
    },
  },
} as const;

export const solanaChainConfig = {
  /** Shown by MetaMask (and other Wallet Standard wallets) on the connect prompt. */
  dappName: "Lovable Game",
  /** Wallets offered for Solana sign-in, in display order. */
  wallets: ["phantom", "solflare", "backpack", "metamask"],
} as const;

export const chainsConfig = {
  hive: hiveChainConfig,
  solana: solanaChainConfig,
} as const;
