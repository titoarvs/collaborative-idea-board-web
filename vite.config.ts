import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart(),
    // nitro builds the server output; on Vercel it auto-detects the
    // `vercel` preset and emits the Build Output API format Vercel serves.
    nitro(),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
  ],
})
