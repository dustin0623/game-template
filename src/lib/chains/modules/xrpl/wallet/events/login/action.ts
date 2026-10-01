/** XRPL login (wallet side): GemWallet, Xaman QR wait, Joey (WalletConnect). Browser only. */
import { encode } from "ripple-binary-codec";
import { xrplChainConfig } from "@/lib/chains/modules/config";
import { buildLoginTx } from "../../../utils";
import type { XamanStatus, XrplQrPrompt } from "../../../types";

export { XRPL_WALLETS } from "../../../types";
export type { XrplWallet, XrplWalletMeta, XrplQrPrompt, XamanStatus } from "../../../types";
export { buildLoginTx } from "../../../utils";




type WcClient = Awaited<ReturnType<typeof import("@walletconnect/sign-client").default.init>>;
let wc: { client: WcClient; topic: string } | null = null;


