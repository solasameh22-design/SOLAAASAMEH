import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, /api calls go to the local API, so the front end and API share one origin (cookies just work).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3001' } },
});
