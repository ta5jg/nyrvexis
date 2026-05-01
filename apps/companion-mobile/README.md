## companion-mobile (Capacitor)

This wraps `apps/companion-web` into installable iOS/Android shells via Capacitor.

### Repo-root shortcut (R1)

After `pnpm i` from monorepo root:

```bash
pnpm run mobile:sync
```

Runs `companion-web` production build then `cap sync`.

First-time only, add native platforms (often not committed in minimal clones):

```bash
pnpm --filter @kindrail/companion-mobile exec cap add ios
pnpm --filter @kindrail/companion-mobile exec cap add android
```

Then run `pnpm run mobile:sync` again from root (or `pnpm --filter @kindrail/companion-mobile exec cap sync`).

### In-app purchases (R7.M1)

The web bundle calls **`@capgo/native-purchases`** when running inside the Capacitor shell (`pnpm run mobile:sync` installs native bits).

**iOS (Xcode)**  

- Add the **In-App Purchase** capability (Signing & Capabilities → + Capability).  
- Create non-consumable / subscription SKUs in App Store Connect; IDs must match gateway `KR_IAP_BATTLE_PASS_PRODUCT_ID_IOS` and optional web overrides `VITE_IAP_BP_PRODUCT_*`.

**Android**

- After `cap add android`, ensure **`com.android.vending.BILLING`** is in `android/app/src/main/AndroidManifest.xml` (merge / uses-permission). Some setups require adding it manually.  
- Create managed products or subscriptions in Play Console; IDs must match `KR_IAP_BATTLE_PASS_PRODUCT_ID_ANDROID`. For **subscriptions**, set `VITE_IAP_BP_TYPE=subs` and **`VITE_IAP_BP_ANDROID_PLAN_ID`** to the base plan id in the companion-web `.env` used at build time.

Sandbox / internal testing: use Apple Sandbox testers and Play internal testing + license testers as usual.

Open Xcode / Android Studio:

```bash
pnpm --filter @kindrail/companion-mobile exec cap open ios
pnpm --filter @kindrail/companion-mobile exec cap open android
```

### Deep links (HTTPS)

Same query params as the web app (e.g. `?ticket=…`, `?ref=…`, `?view=leaderboard`, `?run=1&q=…`).
Compact squad preload: `?squad=soldier,archer,knight,mage` (front L, front R, back L, back R archetype ids).

`@capacitor/app` merges `appUrlOpen` query params into the WebView URL so existing `companion-web` handlers run.
