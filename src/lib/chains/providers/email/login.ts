import { playerRepository, toPlayer } from "@/lib/database/mock/repositories/player.repository";
import type { EmailCredentials } from "./types";
import { verifyPassword } from "./password";

export async function loginWithEmail({ email, password }: EmailCredentials) {
  const record = await playerRepository.findByEmail(email);
  if (!record?.passwordHash || !(await verifyPassword(password, record.passwordHash))) {
    throw new Error("Invalid email or password");
  }
  return toPlayer(record);
}
