import { z } from "zod";
import { KrV1Envelope } from "./envelope.js";
import { HealthResponse } from "./health.js";
import { KrBattleSimRequest, KrBattleSimResult } from "./battle.js";
import { KrDailySeedResponse } from "./daily.js";
import { KrAuthGuestRequest, KrAuthGuestResponse, KrMeResponse } from "./account.js";
import { KrDailyClaimResponse, KrInventoryResponse } from "./inventory.js";
import { KrCatalogResponse } from "./content.js";
import { KrDailyShopResponse, KrShopBuyRequest, KrShopBuyResponse } from "./shop.js";
import { KrOwnedUnitsResponse, KrUpgradeUnitRequest, KrUpgradeUnitResponse } from "./progression.js";
import {
  KrLeaderboardMeResponse,
  KrLeaderboardSubmitRequest,
  KrLeaderboardSubmitResponse,
  KrLeaderboardTopResponse,
  KrReferralAcceptRequest,
  KrReferralAcceptResponse,
  KrReferralStatusResponse,
  KrShareRedeemRequest,
  KrShareRedeemResponse,
  KrShareTicketCreateResponse
} from "./growth.js";

/**
 * Central schema registry for:
 * - JSON Schema emission
 * - docs
 * - future C# DTO generation
 */
export const KrV1Schemas = {
  KrV1Envelope,
  HealthResponse,
  KrBattleSimRequest,
  KrBattleSimResult,
  KrDailySeedResponse,
  KrAuthGuestRequest,
  KrAuthGuestResponse,
  KrMeResponse,
  KrInventoryResponse,
  KrDailyClaimResponse,
  KrCatalogResponse,
  KrDailyShopResponse,
  KrShopBuyRequest,
  KrShopBuyResponse,
  KrOwnedUnitsResponse,
  KrUpgradeUnitRequest,
  KrUpgradeUnitResponse,
  KrLeaderboardSubmitRequest,
  KrLeaderboardSubmitResponse,
  KrLeaderboardTopResponse,
  KrLeaderboardMeResponse,
  KrReferralAcceptRequest,
  KrReferralAcceptResponse,
  KrReferralStatusResponse,
  KrShareTicketCreateResponse,
  KrShareRedeemRequest,
  KrShareRedeemResponse
} satisfies Record<string, z.ZodTypeAny>;

