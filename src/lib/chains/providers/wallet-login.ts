import { config } from "@/lib/config/config";
import type { WalletLogin } from "@/features/types/auth.types";
import { playerRepository, toPlayer } from "@/lib/database/mock/repositories/player.repository";
import { consumeChallenge } from "./challenge.server";
import { verify as verifySolana } from "./solana/verify";
import { verify as verifyHive } from "./hive/verify";
import { verify as verifyXrpl } from "./xrpl/verify";

const verifiers = { solana: verifySolana, hive: verifyHive, xrpl: verifyXrpl } as const;

/** Server: verify a signed challenge and resolve/create the player. */
export async function loginWithWallet(input: WalletLogin) {
  if (config.auth.chain !== input.chain) throw new Error("Chain not enabled");
  await consumeChallenge(input.token, input.chain, input.address, input.message);

  if (!(await verifiers[input.chain](input))) throw new Error("Signature verification failed");

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
