import { z } from "zod";
import { KrV1Envelope } from "./envelope.js";
import { HealthResponse } from "./health.js";
import { KrLegalPublicResponse } from "./legal.js";
import { KrBattleSimRequest, KrBattleSimResult } from "./battle.js";
import { KrDailySeedResponse } from "./daily.js";
import {
  KrAuthGuestRequest,
  KrAuthGuestResponse,
  KrAuthRefreshRequest,
  KrAuthRefreshResponse,
  KrAuthLogoutRequest,
  KrAuthLogoutResponse,
  KrAuthRegisterEmailRequest,
  KrAuthRegisterEmailResponse,
  KrAuthLoginEmailRequest,
  KrAuthLoginEmailResponse,
  KrAuthLinkEmailRequest,
  KrAuthLinkEmailResponse,
  KrAuthGoogleRequest,
  KrAuthGoogleResponse,
  KrAuthLinkGoogleRequest,
  KrAuthLinkGoogleResponse,
  KrMeResponse,
  KrAuthSessionIssued
} from "./account.js";
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
import {
  KrCheckoutCreateRequest,
  KrCheckoutCreateResponse,
  KrOffersResponse,
  KrPurchaseStatusResponse,
  KrBattlePassIapVerifyRequest,
  KrBattlePassIapVerifyResponseOk
} from "./monetization.js";
import {
  KrPushWebSubscribeRequest,
  KrPushWebSubscribeResponse,
  KrPushWebUnsubscribeRequest,
  KrPushWebUnsubscribeResponse,
  KrPushWebVapidResponse
} from "./push.js";
import { KrInternalPushDailyRequest, KrInternalPushDailyResponse } from "./internal.js";
import {
  KrAdminBalanceGetResponse,
  KrAdminBalanceSetRequest,
  KrAdminBalanceSetResponse,
  KrMetaBattlePassClaimRequest,
  KrMetaBattlePassClaimResponse,
  KrMetaContent,
  KrMetaProgressResponse,
  KrMetaQuestClaimRequest,
  KrMetaQuestClaimResponse
} from "./meta.js";
import { KrSeasonDef, KrSeasonViewResponse } from "./season.js";
import {
  KrCosmeticsCatalogResponse,
  KrCosmeticsEquipRequest,
  KrCosmeticsEquipResponse,
  KrCosmeticsMeResponse
} from "./cosmetics.js";
import { KrAnalyticsEventRequest, KrAnalyticsEventResponse } from "./analytics.js";

/**
 * Central schema registry for:
 * - JSON Schema emission
 * - docs
 * - future C# DTO generation
 */
export const KrV1Schemas = {
  KrV1Envelope,
  HealthResponse,
  KrLegalPublicResponse,
  KrBattleSimRequest,
  KrBattleSimResult,
  KrDailySeedResponse,
  KrAuthGuestRequest,
  KrAuthGuestResponse,
  KrAuthRefreshRequest,
  KrAuthRefreshResponse,
  KrAuthLogoutRequest,
  KrAuthLogoutResponse,
  KrAuthRegisterEmailRequest,
  KrAuthRegisterEmailResponse,
  KrAuthLoginEmailRequest,
  KrAuthLoginEmailResponse,
  KrAuthLinkEmailRequest,
  KrAuthLinkEmailResponse,
  KrAuthGoogleRequest,
  KrAuthGoogleResponse,
  KrAuthLinkGoogleRequest,
  KrAuthLinkGoogleResponse,
  KrAuthSessionIssued,
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
  KrShareRedeemResponse,
  KrOffersResponse,
  KrCheckoutCreateRequest,
  KrCheckoutCreateResponse,
  KrPurchaseStatusResponse,
  KrBattlePassIapVerifyRequest,
  KrBattlePassIapVerifyResponseOk,
  KrPushWebVapidResponse,
  KrPushWebSubscribeRequest,
  KrPushWebSubscribeResponse,
  KrPushWebUnsubscribeRequest,
  KrPushWebUnsubscribeResponse,
  KrInternalPushDailyRequest,
  KrInternalPushDailyResponse,
  KrMetaContent,
  KrMetaProgressResponse,
  KrMetaQuestClaimRequest,
  KrMetaQuestClaimResponse,
  KrMetaBattlePassClaimRequest,
  KrMetaBattlePassClaimResponse,
  KrAdminBalanceGetResponse,
  KrAdminBalanceSetRequest,
  KrAdminBalanceSetResponse,
  KrSeasonDef,
  KrSeasonViewResponse,
  KrCosmeticsCatalogResponse,
  KrCosmeticsMeResponse,
  KrCosmeticsEquipRequest,
  KrCosmeticsEquipResponse,
  KrAnalyticsEventRequest,
  KrAnalyticsEventResponse
} satisfies Record<string, z.ZodTypeAny>;

