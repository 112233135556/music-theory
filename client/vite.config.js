import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: false, // Désactivé : un fichier nommé 'public' existe dans client/ et casse le build
})
