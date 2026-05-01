/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_GATEWAY_URL?: string;
  /** Same OAuth Web Client ID as gateway KR_GOOGLE_CLIENT_ID for GIS Sign-In. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Premium Battle Pass SKU (must match gateway KR_IAP_BATTLE_PASS_PRODUCT_ID_IOS). */
  readonly VITE_IAP_BP_PRODUCT_IOS?: string;
  readonly VITE_IAP_BP_PRODUCT_ANDROID?: string;
  /** `inapp` (default) or `subs` — Play subscriptions require VITE_IAP_BP_ANDROID_PLAN_ID. */
  readonly VITE_IAP_BP_TYPE?: string;
  /** Google Play base plan id when VITE_IAP_BP_TYPE=subs. */
  readonly VITE_IAP_BP_ANDROID_PLAN_ID?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: { client_id: string; callback: (res: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, opts: Record<string, unknown>) => void;
          prompt: (momentNotification?: (notification?: unknown) => void) => void;
        };
      };
    };
  }
}

export {};
