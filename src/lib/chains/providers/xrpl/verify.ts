import { verifyXrplSignature } from "@/lib/chains/modules/xrpl";
import type { WalletLogin } from "@/features/types/auth.types";

/** Server: verify an XRPL login via the module login event. */
export async function verify(input: WalletLogin): Promise<boolean> {
  return !!input.publicKey && verifyXrplSignature(input.address, input.publicKey, input.message, input.signature);
}
