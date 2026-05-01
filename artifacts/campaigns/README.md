# Bundle campaigns & monetization ops artifacts (BD.M1 / BD.M2)

These files are **templates** for live-ops and store metadata. They do not change runtime behavior until copied into gateway content or storefronts.

| File | Purpose |
|------|---------|
| `TEMPLATE_bundle_calendar.v1.json` | **BD.M1** — timed campaigns (windows, highlighted offer IDs, channels). |
| `TEMPLATE_bundle_offer_localization.v1.json` | **BD.M2** — per-offer localized name/description/compliance blurbs aligned with deterministic `KrOffer` grants. |

**Workflow:** duplicate templates → edit IDs/dates → attach locale strings to client i18n keys (`titleKey` / `bodyKey`) when UI reads this calendar → keep `offerId` in sync with `services/gateway/src/monetization/offers.ts`.

## Rewarded ads (R7.M5)

Current product stance: **no rewarded ads in MVP.** Gateway default flag `growth_rewarded_ads` is **false** (`GET /flags`). If ads are added later: pick an SDK, show **ATT** on iOS where required, use Google’s UMP/consent flows on Android as applicable, keep rewards **optional** and **non pay-to-win**, and gate any server grants behind explicit flag + abuse caps.
