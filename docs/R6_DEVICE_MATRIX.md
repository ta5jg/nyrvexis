<!-- =============================================================================
File:           docs/R6_DEVICE_MATRIX.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-05-01
Last Update:    2026-05-01
Version:        1.0.0

Description:
  R6.2 — hedef cihaz / ortam matrisi (manuel doğrulama + CI konumu).

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

## NYRVEXIS — Cihaz / OS matrisi (R6.2)

**SSOT otomasyon:** `apps/companion-web/e2e/smoke.spec.ts` + GitHub Actions `nyrvexis-ci.yml` altında **Chromium / ubuntu-latest** headless smoke.

| Ortam | Minimum bar | Otomasyon | Not |
|--------|-------------|-----------|-----|
| Web — Chromium (Linux) | Gate → Battle → Run battle → Result | CI Playwright | Üretim görünümüne yakın |
| Web — Safari (macOS / iOS) | Giriş, ses (user gesture), replay scrub | Manuel çeyrek | StoreKit / GIS ile uyum |
| Web — Firefox | Ana akış | Manuel spot | Odak `focus-visible` |
| Android — Chrome | Dokunma hedefleri ≥44px | Manuel | `pointer: coarse` CSS |
| Android — Capacitor WebView | `mobile:sync` sonrası APK/AAB | Manuel smoke | `127.0.0.1:8787` emülatör köprüsü |
| iOS — Safari / WKWebView | Aynı | Manuel / TestFlight | Güvenli token saklama |

**Periyodik görev:** Her yayın adayı için en az bir **gerçek mobil** cihazda tam akış (giriş → maç → meta panel).
