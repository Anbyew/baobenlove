import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  publicDir: '../assets',
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    proxy: {
      // Local-only: the backdoor Setup, Packing & Key Info pages aren't deployed
      // yet, so in dev their endpoints go to a local server/ instance
      // (LOCAL_API, default :3001) while everything else — real RSVP and
      // seating data, OTP email login — still goes to production. Remove
      // these entries once /setup, /packing and /keyinfo are live on baoben.love.
      '/api/setup': {
        target: process.env.LOCAL_API ?? 'http://localhost:3001',
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      '/api/keyinfo': {
        target: process.env.LOCAL_API ?? 'http://localhost:3001',
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      '/api/packing': {
        target: process.env.LOCAL_API ?? 'http://localhost:3001',
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      '/api': {
        target: 'https://baoben.love',
        changeOrigin: true,
      },
    },
  },
})
