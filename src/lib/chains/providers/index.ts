/** Browser-facing auth API. Orchestrates the chain modules + server functions. */
import type { ChainProvider } from "@/lib/config/config";
import { walletChallengeFn, walletLoginFn, emailLoginFn, emailSignupFn } from "./auth.functions";
import { connectSolana, signSolanaLogin } from "@/lib/chains/modules/solana";
import { signHiveLogin } from "@/lib/chains/modules/hive";
import { connectXrpl, signXrplLogin } from "@/lib/chains/modules/xrpl";

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
  const sign =
    chain === "solana" ? signSolanaLogin : chain === "xrpl" ? signXrplLogin : signHiveLogin;
  const { signature } = await sign(address, message);

  return walletLoginFn({ data: { chain, address, message, token, signature, publicKey } });
}
