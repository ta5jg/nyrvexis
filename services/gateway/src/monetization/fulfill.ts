import type { FileStore } from "../store/store.js";
import type { PgStore } from "../store/pgStore.js";
import { getOffer } from "./offers.js";

export function grantOfferToUser(
  store: FileStore | PgStore,
  input: { userId: string; offerId: string; purchaseId: string }
) {
  const offer = getOffer(input.offerId);
  if (!offer) throw new Error("UNKNOWN_OFFER");

  const now = Date.now();
  store.mutate((s) => {
    const inv = s.inventory[input.userId];
    if (!inv) throw new Error("NOT_FOUND");

    inv.gold = (inv.gold + offer.grants.gold) | 0;
    inv.shards = (inv.shards + offer.grants.shards) | 0;
    inv.keys = (inv.keys + offer.grants.keys) | 0;
    inv.updatedAtMs = now;

    const p = s.purchases[input.purchaseId];
    if (p) p.fulfilledAtMs = now;
  });
}

