/**
 * Transfer native SOL or an SPL token on Solana mainnet.
 *
 * Two signers:
 *  - "wallet": the player's browser wallet signs and sends (Phantom, Solflare,
 *    Backpack, MetaMask).
 *  - "server": the configured treasury key signs server-side (payouts).
 *
 * A returned signature only proves the transaction was broadcast. Always
 * confirm with `validatePayment` before crediting anything in the game.
 */
import { z } from "zod";
import bs58 from "bs58";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
} from "@solana/spl-token";
import { getSolanaClient, type SolanaClient } from "../../client";
import { chainEnv } from "@/lib/chains/modules/config";
import { getInjectedSolanaProvider } from "../login/action";
import { SolanaWalletSchema, type SolanaWallet } from "../login/types";
import {
  SolanaAddressSchema,
  SolanaSymbolSchema,
  QuantitySchema,
  MetadataSchema,
  SolanaSignerSchema,
  toBaseUnits,
  ok,
  fail,
  type SolanaActionResult,
} from "../../types";

/** SPL Memo program — carries the game's action tag with the transfer. */
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export const TransferTokenInput = z.object({
  signer: SolanaSignerSchema.default("wallet"),
  /** Required for the wallet signer: the connected player address. */
  from: SolanaAddressSchema.optional(),
  /** Which browser wallet signs (wallet signer only). */
  wallet: SolanaWalletSchema.default("phantom"),
  /** Configured backend account alias (server signer only). */
  alias: z.string().trim().min(1).default("treasury"),
  to: SolanaAddressSchema,
  amount: QuantitySchema,
  /** "SOL" for native, otherwise the SPL mint address. */
  symbol: SolanaSymbolSchema.default("SOL"),
  /** Standardized game action, written into the memo. */
  action: z.string().trim().min(1).optional(),
  metadata: MetadataSchema,
  client: z.custom<SolanaClient>().optional(),
});

export type TransferTokenInput = z.input<typeof TransferTokenInput>;

export type SolanaTransferResult = {
  signature: string;
  symbol: string;
  amount: string;
  from: string;
  to: string;
  signer: "wallet" | "server";
};

type WalletSender = { address: string; send: (tx: Transaction) => Promise<string> };

type MetaMaskSendFeature = {
  features: {
    "solana:signAndSendTransaction": {
      signAndSendTransaction: (input: {
        account: { address: string };
        transaction: Uint8Array;
        chain: string;
      }) => Promise<Array<{ signature: Uint8Array | string }>>;
    };
    "standard:connect": { connect: () => Promise<{ accounts: Array<{ address: string }> }> };
  };
};

/** Resolve a browser wallet that can sign and send a transaction. */
async function walletSender(wallet: SolanaWallet, from: string): Promise<WalletSender> {
  if (wallet === "metamask") {
    const { createSolanaClient } = await import("@metamask/connect-solana");
    const mmClient = await createSolanaClient({
      dapp: { name: "Lovable Game", url: typeof window !== "undefined" ? window.location.origin : "" },
    });
    const mm = mmClient.getWallet() as unknown as MetaMaskSendFeature;
    if (!mm) throw new Error("MetaMask wallet not found. Install it from https://metamask.io/download.");
    return {
      address: from,
      send: async (tx) => {
        const [result] = await mm.features["solana:signAndSendTransaction"].signAndSendTransaction({
          account: { address: from },
          transaction: tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
          chain: "solana:mainnet",
        });
        if (!result) throw new Error("MetaMask did not return a signature.");
        return typeof result.signature === "string" ? result.signature : bs58.encode(result.signature);
      },
    };
  }

  const provider = getInjectedSolanaProvider(wallet);
  if (!provider.signAndSendTransaction) {
    throw new Error("This wallet cannot send transactions. Try Phantom, Solflare or Backpack.");
  }
  return {
    address: from,
    send: async (tx) => (await provider.signAndSendTransaction!(tx)).signature,
  };
}

/** Load the server treasury keypair from its environment variable. */
function treasuryKeypair(alias: string): Keypair {
  const keyEnv = alias === "treasury" ? chainEnv.solana.treasurySecretKey : `SOLANA_${alias.toUpperCase()}_SECRET_KEY`;
  const secret = typeof process !== "undefined" ? process.env?.[keyEnv] : undefined;
  if (!secret) throw new Error(`Missing ${keyEnv}. Add the Solana signing key before sending payouts.`);
  const bytes = secret.trim().startsWith("[")
    ? Uint8Array.from(JSON.parse(secret) as number[])
    : bs58.decode(secret.trim());
  return Keypair.fromSecretKey(bytes);
}

export async function transferToken(
  input: TransferTokenInput,
): Promise<SolanaActionResult<SolanaTransferResult>> {
  const parsed = TransferTokenInput.safeParse(input);
  if (!parsed.success) return fail(new Error(parsed.error.issues[0]?.message ?? "Invalid input"));

  const { signer, from, wallet, alias, to, amount, symbol, action, metadata } = parsed.data;
  const solana = parsed.data.client ?? getSolanaClient();

  try {
    let keypair: Keypair | null = null;
    let sender: WalletSender;

    if (signer === "wallet") {
      if (!from) return fail(new Error("A connected wallet address is required to sign in the browser"));
      sender = await walletSender(wallet, from);
    } else {
      keypair = treasuryKeypair(alias);
      sender = {
        address: keypair.publicKey.toString(),
        send: async (tx) => {
          tx.sign(keypair!);
          return solana.sendRawTransaction(tx.serialize(), { preflightCommitment: "confirmed" });
        },
      };
    }

    const payer = new PublicKey(sender.address);
    const recipient = new PublicKey(to);
    const tx = new Transaction();

    if (symbol === "SOL") {
      tx.add(
        SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: recipient,
          lamports: toBaseUnits(amount, 9),
        }),
      );
    } else {
      const mint = new PublicKey(symbol);
      const { decimals } = await getMint(solana, mint);
      const source = await getAssociatedTokenAddress(mint, payer);
      const destination = await getAssociatedTokenAddress(mint, recipient);

      if (!(await solana.getAccountInfo(destination))) {
        tx.add(createAssociatedTokenAccountInstruction(payer, destination, recipient, mint));
      }
      tx.add(
        createTransferCheckedInstruction(source, mint, destination, payer, toBaseUnits(amount, decimals), decimals),
      );
    }

    if (action) {
      tx.add(
        new TransactionInstruction({
          keys: [],
          programId: MEMO_PROGRAM_ID,
          data: Buffer.from(JSON.stringify({ action, metadata: metadata ?? null }), "utf8"),
        }),
      );
    }

    const { blockhash } = await solana.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.feePayer = payer;

    const signature = await sender.send(tx);
    return ok({ signature, symbol, amount, from: sender.address, to, signer });
  } catch (error) {
    return fail(error);
  }
}
