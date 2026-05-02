import { type NvOffer } from "@nyrvexis/protocol";

export const OFFERS: NvOffer[] = [
  {
    offerId: "starter_pack_v1",
    name: "Starter Pack",
    priceCents: 499,
    currency: "USD",
    grants: {
      gold: 1200,
      shards: 60,
      keys: 1
    }
  }
];

export function getOffer(offerId: string): NvOffer | null {
  return OFFERS.find((o) => o.offerId === offerId) ?? null;
}

