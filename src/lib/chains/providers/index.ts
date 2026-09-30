/** Browser-facing auth API. Wallet adapters + server functions. */
import type { ChainProvider } from "@/lib/config/config";
import { walletChallengeFn, walletLoginFn, emailLoginFn, emailSignupFn } from "./auth.functions";
import { connectSolana, signSolana } from "./solana/wallet";
import { signHive } from "./hive/wallet";
import { connectXrpl, signXrpl } from "./xrpl/wallet";

export { emailLoginFn, emailSignupFn };

/** Full wallet login flow: connect → challenge → sign → verify. `hiveUsername` required for Hive. */
export async function walletLogin(chain: ChainProvider, hiveUsername?: string) {
  let address: string;
  let publicKey: string | undefined;
  if (chain === "solana") ({ address } = await connectSolana());
  else if (chain === "xrpl") ({ address, publicKey } = await connectXrpl());
  else {
    address = (hiveUsername ?? "").trim().toLowerCase().replace(/^@/, "");
    if (!address) throw new Error("Enter your Hive username");
  }

  const { message, token } = await walletChallengeFn({ data: { chain, address } });
  const { signature } =
    chain === "solana" ? await signSolana(message) : chain === "xrpl" ? await signXrpl(message) : await signHive(address, message);

  return walletLoginFn({ data: { chain, address, message, token, signature, publicKey } });
}
