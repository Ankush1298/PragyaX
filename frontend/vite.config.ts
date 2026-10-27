import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// /api is proxied to FastAPI so the browser never needs CORS in dev.
// Override when port 8000 is busy: VITE_BACKEND_URL=http://127.0.0.1:8001 npm run dev
const backend = process.env.VITE_BACKEND_URL ?? "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": backend },
  },
});
