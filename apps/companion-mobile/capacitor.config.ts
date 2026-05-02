import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nyrvexis.companion",
  appName: "NYRVEXIS",
  webDir: "../companion-web/dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https"
  }
};

export default config;

