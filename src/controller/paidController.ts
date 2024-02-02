import { Request, Response } from "express";
import { lnProvider, nostrPool, wallet } from "..";
import { Claim, Transaction } from "../models";
import { createZapReceipt, extractZapRequestData } from "../utils/nostr";

const relays = [
  "wss://relay.current.fyi",
  "wss://nostr-pub.wellorder.net",
  "wss://relay.damus.io",
  "wss://nostr.zebedee.cloud",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://nostr.mom",
];

export async function paidController(
  req: Request<
    unknown,
    unknown,
    {
      eventType: string;
      transaction: {
        memo: string;
        settlementAmount: number;
        initiationVia: { paymentHash: string };
      };
    },
    unknown
  >,
  res: Response,
) {
  const { eventType, transaction } = req.body;
  if (eventType === "receive.lightning") {
    const newAmount =
      Number(transaction.settlementAmount) -
      Math.floor(Math.max(Number(transaction.settlementAmount) / 100, 1));
    const reqHash = transaction.initiationVia.paymentHash;
    try {
      const internalTx = await Transaction.getTransactionByHash(reqHash);
      if (internalTx.zap_request && process.env.ZAP_SECRET_KEY) {
        try {
          const zapRequestData = extractZapRequestData(internalTx.zap_request);
          const zapReceipt = createZapReceipt(
            Math.floor(Date.now() / 1000),
            zapRequestData.pTags[0],
            zapRequestData.eTags[0],
            internalTx.server_pr,
            JSON.stringify(internalTx.zap_request),
          );
          //@ts-ignore
          await Promise.any(
            nostrPool.publish(zapRequestData.relays || relays, zapReceipt),
          );
        } catch (e) {
          console.log(e);
        }
      }
      try {
        await lnProvider.payInvoice(internalTx.mint_pr);
      } catch (e) {
        // TO-DO log failed payment and retry
      }
      const { proofs } = await wallet.requestTokens(
        newAmount,
        internalTx.mint_hash,
      );
      Claim.createClaim(internalTx.user, process.env.MINTURL!, proofs);
      res.sendStatus(200);
    } catch {
      return res.sendStatus(200);
    }
  } else {
    return res.sendStatus(200);
  }
}
