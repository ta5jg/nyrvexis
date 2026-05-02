# Store listing drafts (R8.1)

Copy **`TEMPLATE_store_listing.v1.json`** → `nyrvexis_store_listing.v1.json` (gitignore if contains unreleased copy), fill EN/TR (or target locales), then paste into App Store Connect and Google Play listings.

Screenshots live outside this repo (binary assets); checklist keys under `visualChecklist.screenshots` mirror common store requirements.

Operational URLs should match **`GET /legal/public`** after gateway env is set (`KR_LEGAL_*`).
