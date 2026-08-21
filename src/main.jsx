import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { initAnalytics } from "./analytics.js";

// Outside Claude artifacts there is no window.storage — shim it with
// localStorage so quest progress persists locally too. (Inside artifacts
// the real storage API is already present and this shim is skipped.)
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key) {
      const v = localStorage.getItem(key);
      if (v === null) throw new Error("key not found");
      return { key, value: v };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
      return { key, value };
    },
    async delete(key) {
      localStorage.removeItem(key);
      return { key, deleted: true };
    },
  };
}

// Loaded before the scene so that the earliest signals — a browser with no
// WebGL, a visitor who leaves during the pesichah — are not lost.
initAnalytics();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
