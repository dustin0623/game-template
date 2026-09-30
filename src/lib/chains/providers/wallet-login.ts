import { config } from "@/lib/config/config";
import type { WalletLogin } from "@/features/types/auth.types";
import { playerRepository, toPlayer } from "@/lib/database/mock/repositories/player.repository";
import { consumeChallenge } from "./challenge.server";
import { verifySolanaSignature } from "./solana/signature";
import { verifyHiveSignature } from "./hive/signature";
import { getHiveClient } from "@/lib/chains/modules/hive/client";
import { verifyXrplSignature } from "./xrpl/signature";

/** Server: verify a signed challenge and resolve/create the player. */
export async function loginWithWallet(input: WalletLogin) {
  if (config.auth.chain !== input.chain) throw new Error("Chain not enabled");
  await consumeChallenge(input.token, input.chain, input.address, input.message);

  let ok = false;
  if (input.chain === "solana") ok = verifySolanaSignature(input.address, input.message, input.signature);
  if (input.chain === "hive")
    ok = await verifyHiveSignature(getHiveClient().rpc.endpoint, input.address, input.message, input.signature);
  if (input.chain === "xrpl") ok = !!input.publicKey && verifyXrplSignature(input.address, input.publicKey, input.message, input.signature);
  if (!ok) throw new Error("Signature verification failed");

  const existing = await playerRepository.findByChain(input.chain, input.address);
  const record =
    existing ??
    (await playerRepository.create({
      email: null,
      passwordHash: null,
      chain: input.chain,
      chainAddress: input.address,
      displayName: input.chain === "hive" ? `@${input.address}` : `${input.address.slice(0, 4)}…${input.address.slice(-4)}`,
    }));
  return toPlayer(record);
}
