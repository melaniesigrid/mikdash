import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://<user>.github.io/mikdash/ — Pages puts the site under
// the repo name, so every asset URL needs that prefix. Local dev keeps "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/mikdash/" : "/",
  plugins: [react()],
  build: {
    // one big Three.js scene in a single chunk is the intent here, not an oversight
    chunkSizeWarningLimit: 1200,
  },
}));
