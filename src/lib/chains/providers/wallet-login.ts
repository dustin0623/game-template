import { config } from "@/lib/config/config";
import type { WalletLogin } from "@/features/types/auth.types";
import { playerRepository, toPlayer } from "@/lib/modules/players/server.repository";
import { consumeChallenge } from "./challenge.server";
import { verify as verifySolana } from "./solana/verify";
import { verify as verifyHive } from "./hive/verify";
import { verify as verifyXrpl } from "./xrpl/verify";

/** Each verifier returns true/false, or the verified address (XRPL: Xaman resolves it). */
const verifiers: Record<WalletLogin["chain"], (i: WalletLogin) => Promise<boolean | string | null>> = {
  solana: verifySolana,
  hive: verifyHive,
  xrpl: verifyXrpl,
};

/** Server: verify a signed challenge and resolve/create the player. */
export async function loginWithWallet(input: WalletLogin) {
  if (config.auth.chain !== input.chain) throw new Error("Chain not enabled");
  await consumeChallenge(input.token, input.chain, input.address, input.message);

  const result = await verifiers[input.chain](input);
  const address = typeof result === "string" ? result : result ? input.address : null;
  if (!address) throw new Error("Signature verification failed");

  const existing = await playerRepository.findByChain(input.chain, address);
  const record =
    existing ??
    (await playerRepository.create({
      email: null,
      passwordHash: null,
      chain: input.chain,
      chainAddress: address,
      displayName: input.chain === "hive" ? `@${address}` : `${address.slice(0, 4)}…${address.slice(-4)}`,
    }));
  return toPlayer(record);
}
