import { z } from "zod";
import { NvV1Envelope } from "./envelope.js";
import { HealthResponse } from "./health.js";
import { NvLegalPublicResponse } from "./legal.js";
import { NvBattleSimRequest, NvBattleSimResult } from "./battle.js";
import { NvDailySeedResponse } from "./daily.js";
import {
  NvAuthGuestRequest,
  NvAuthGuestResponse,
  NvAuthRefreshRequest,
  NvAuthRefreshResponse,
  NvAuthLogoutRequest,
  NvAuthLogoutResponse,
  NvAuthRegisterEmailRequest,
  NvAuthRegisterEmailResponse,
  NvAuthLoginEmailRequest,
  NvAuthLoginEmailResponse,
  NvAuthLinkEmailRequest,
  NvAuthLinkEmailResponse,
  NvAuthGoogleRequest,
  NvAuthGoogleResponse,
  NvAuthLinkGoogleRequest,
  NvAuthLinkGoogleResponse,
  NvMeResponse,
  NvAuthSessionIssued
} from "./account.js";
import { NvDailyClaimResponse, NvInventoryResponse } from "./inventory.js";
import { NvCatalogResponse, NvSynergyRule, NvAugmentDef, NvStatBonus } from "./content.js";
import { NvDailyShopResponse, NvShopBuyRequest, NvShopBuyResponse } from "./shop.js";
import { NvOwnedUnitsResponse, NvUpgradeUnitRequest, NvUpgradeUnitResponse } from "./progression.js";
import {
  NvLeaderboardMeResponse,
  NvLeaderboardSubmitRequest,
  NvLeaderboardSubmitResponse,
  NvLeaderboardTopResponse,
  NvReferralAcceptRequest,
  NvReferralAcceptResponse,
  NvReferralStatusResponse,
  NvShareRedeemRequest,
  NvShareRedeemResponse,
  NvShareTicketCreateResponse
} from "./growth.js";
import {
  NvCheckoutCreateRequest,
  NvCheckoutCreateResponse,
  NvOffersResponse,
  NvPurchaseStatusResponse,
  NvBattlePassIapVerifyRequest,
  NvBattlePassIapVerifyResponseOk
} from "./monetization.js";
import {
  NvPushWebSubscribeRequest,
  NvPushWebSubscribeResponse,
  NvPushWebUnsubscribeRequest,
  NvPushWebUnsubscribeResponse,
  NvPushWebVapidResponse
} from "./push.js";
import { NvInternalPushDailyRequest, NvInternalPushDailyResponse } from "./internal.js";
import {
  NvAdminBalanceGetResponse,
  NvAdminBalanceSetRequest,
  NvAdminBalanceSetResponse,
  NvMetaBattlePassClaimRequest,
  NvMetaBattlePassClaimResponse,
  NvMetaContent,
  NvMetaProgressResponse,
  NvMetaQuestClaimRequest,
  NvMetaQuestClaimResponse
} from "./meta.js";
import { NvSeasonDef, NvSeasonViewResponse } from "./season.js";
import {
  NvCosmeticsCatalogResponse,
  NvCosmeticsEquipRequest,
  NvCosmeticsEquipResponse,
  NvCosmeticsMeResponse
} from "./cosmetics.js";
import { NvHubLayoutPutRequest, NvHubLayoutResponse, NvHubShareCreateRequest, NvHubShareCreateResponse, NvHubSharePublicResponse } from "./hub.js";
import { NvAnalyticsEventRequest, NvAnalyticsEventResponse } from "./analytics.js";

/**
 * Central schema registry for:
 * - JSON Schema emission
 * - docs
 * - future C# DTO generation
 */
export const NvV1Schemas = {
  NvV1Envelope,
  HealthResponse,
  NvLegalPublicResponse,
  NvBattleSimRequest,
  NvBattleSimResult,
  NvDailySeedResponse,
  NvAuthGuestRequest,
  NvAuthGuestResponse,
  NvAuthRefreshRequest,
  NvAuthRefreshResponse,
  NvAuthLogoutRequest,
  NvAuthLogoutResponse,
  NvAuthRegisterEmailRequest,
  NvAuthRegisterEmailResponse,
  NvAuthLoginEmailRequest,
  NvAuthLoginEmailResponse,
  NvAuthLinkEmailRequest,
  NvAuthLinkEmailResponse,
  NvAuthGoogleRequest,
  NvAuthGoogleResponse,
  NvAuthLinkGoogleRequest,
  NvAuthLinkGoogleResponse,
  NvAuthSessionIssued,
  NvMeResponse,
  NvInventoryResponse,
  NvDailyClaimResponse,
  NvCatalogResponse,
  NvSynergyRule,
  NvAugmentDef,
  NvStatBonus,
  NvDailyShopResponse,
  NvShopBuyRequest,
  NvShopBuyResponse,
  NvOwnedUnitsResponse,
  NvUpgradeUnitRequest,
  NvUpgradeUnitResponse,
  NvLeaderboardSubmitRequest,
  NvLeaderboardSubmitResponse,
  NvLeaderboardTopResponse,
  NvLeaderboardMeResponse,
  NvReferralAcceptRequest,
  NvReferralAcceptResponse,
  NvReferralStatusResponse,
  NvShareTicketCreateResponse,
  NvShareRedeemRequest,
  NvShareRedeemResponse,
  NvOffersResponse,
  NvCheckoutCreateRequest,
  NvCheckoutCreateResponse,
  NvPurchaseStatusResponse,
  NvBattlePassIapVerifyRequest,
  NvBattlePassIapVerifyResponseOk,
  NvPushWebVapidResponse,
  NvPushWebSubscribeRequest,
  NvPushWebSubscribeResponse,
  NvPushWebUnsubscribeRequest,
  NvPushWebUnsubscribeResponse,
  NvInternalPushDailyRequest,
  NvInternalPushDailyResponse,
  NvMetaContent,
  NvMetaProgressResponse,
  NvMetaQuestClaimRequest,
  NvMetaQuestClaimResponse,
  NvMetaBattlePassClaimRequest,
  NvMetaBattlePassClaimResponse,
  NvAdminBalanceGetResponse,
  NvAdminBalanceSetRequest,
  NvAdminBalanceSetResponse,
  NvSeasonDef,
  NvSeasonViewResponse,
  NvCosmeticsCatalogResponse,
  NvCosmeticsMeResponse,
  NvCosmeticsEquipRequest,
  NvCosmeticsEquipResponse,
  NvHubLayoutResponse,
  NvHubLayoutPutRequest,
  NvHubShareCreateRequest,
  NvHubShareCreateResponse,
  NvHubSharePublicResponse,
  NvAnalyticsEventRequest,
  NvAnalyticsEventResponse
} satisfies Record<string, z.ZodTypeAny>;

