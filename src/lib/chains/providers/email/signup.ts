import { playerRepository, toPlayer } from "@/lib/database/mock/repositories/player.repository";
import type { EmailCredentials } from "./types";
import { hashPassword } from "./password";

export async function signupWithEmail({ email, password }: EmailCredentials) {
  if (await playerRepository.findByEmail(email)) throw new Error("Email already registered");
  const record = await playerRepository.create({
    email,
    passwordHash: await hashPassword(password),
    chain: null,
    chainAddress: null,
    displayName: email.split("@")[0]!,
  });
  return toPlayer(record);
}
