import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "KINDRAIL",
        short_name: "KINDRAIL",
        description: "Daily battles, replays, shop, leaderboard, and share rewards.",
        theme_color: "#070a12",
        background_color: "#070a12",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  }
});

