import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { initDeviceStorage } from "./ui/device";
import { App } from "./ui/App";
import "./ui/styles.css";

registerSW({ immediate: true });

async function bootstrap() {
  await initDeviceStorage();
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

void bootstrap();

