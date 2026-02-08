/**
 * vite.config.js
 *
 * Vite configuration for the Vantage landing page website.
 * Uses the React plugin for JSX support and fast refresh.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
});
