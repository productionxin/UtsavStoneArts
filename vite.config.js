import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
  plugins: [react(), glsl()],
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei']
  }
})
