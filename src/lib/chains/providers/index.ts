/** Browser-facing auth API. Orchestrates chain providers + server functions. */
import type { ChainProvider } from "@/lib/config/config";
import { walletChallengeFn, walletLoginFn, emailLoginFn, emailSignupFn } from "./auth.functions";
import * as solana from "./solana/sign";
import * as xrpl from "./xrpl/sign";
import { connect as connectHive } from "./hive";
import { sign as signHive } from "./hive/sign";

export { emailLoginFn, emailSignupFn };

const signers = {
  solana: { connect: () => solana.connect(), sign: solana.sign },
  xrpl: { connect: () => xrpl.connect(), sign: xrpl.sign },
  hive: { connect: connectHive, sign: signHive },
} as const;

/** Full wallet login flow: connect → challenge → sign → verify. `hiveUsername` required for Hive. */
export async function walletLogin(chain: ChainProvider, hiveUsername?: string) {
  const provider = signers[chain];
  const { address, publicKey } = (await provider.connect(hiveUsername)) as {
    address: string;
    publicKey?: string;
  };
  const { message, token } = await walletChallengeFn({ data: { chain, address } });
  const { signature } = await provider.sign(address, message);
  return walletLoginFn({ data: { chain, address, message, token, signature, publicKey } });
}
