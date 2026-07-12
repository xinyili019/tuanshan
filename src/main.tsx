import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;

  window.addEventListener(
    "load",
    () => {
      const appBasePath = (import.meta as ImportMeta & {
        env: { BASE_URL: string };
      }).env.BASE_URL;
      const serviceWorkerUrl = new URL(
        `${appBasePath}sw.js`,
        window.location.href
      );

      void navigator.serviceWorker.register(serviceWorkerUrl.href).catch((error) => {
        console.warn("Service worker registration failed:", error);
      });
    },
    { once: true }
  );
}

registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
