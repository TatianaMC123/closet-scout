/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["brand/*.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Closet Scout",
        short_name: "Closet Scout",
        description: "A personal stylist for second-hand shopping: your size, your style, Vinted searches made for you.",
        lang: "en",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#FDF6F9",
        theme_color: "#2459C2",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
        // Never cache calls to Anthropic: they carry the user's key and must stay live.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
