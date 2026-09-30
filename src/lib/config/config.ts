/**
 * Shared application configuration (frontend + server).
 * Never put secrets here.
 */
export type ChainProvider = "solana" | "hive" | "xrpl";

export const config = {
  app: {
    name: "Game",
  },
  auth: {
    /** Email + password login enabled. */
    email: true,
    /**
     * At most ONE blockchain auth provider per app/account.
     * Supported: email only, email + chain, chain only (set email: false).
     */
    chain: "hive" as ChainProvider | null,
    /** Challenge lifetime for wallet signatures. */
    challengeTtlMs: 5 * 60 * 1000,
  },
  chains: {
    hive: { rpc: "https://api.hive.blog" },
  },
} as const;
