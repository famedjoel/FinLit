import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow connections from any device on the network
    port: 5173, // Default Vite port
    strictPort: true, // Fail if port is already in use
    hmr: {
      // Allow HMR to work across devices
      host: 'localhost',
      port: 5173,
    },
    proxy: {
      "/api": {
        target: "http://localhost:5900",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});