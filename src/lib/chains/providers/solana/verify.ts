import { verifySolanaSignature } from "@/lib/chains/modules/solana/events/login/action";
import type { WalletLogin } from "@/features/types/auth.types";

/** Server: verify a Solana login via the module login event. */
export async function verify(input: WalletLogin): Promise<boolean> {
  return verifySolanaSignature(input.address, input.message, input.signature);
}
