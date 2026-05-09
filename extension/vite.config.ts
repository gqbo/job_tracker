import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  // Extension reads Supabase credentials at build time
  define: {
    __SUPABASE_URL__: JSON.stringify(process.env.VITE_SUPABASE_URL ?? ''),
    __SUPABASE_ANON_KEY__: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY ?? ''),
    __API_BASE_URL__: JSON.stringify(process.env.VITE_API_BASE_URL ?? ''),
  },
})
