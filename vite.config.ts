import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Expose to network (0.0.0.0) so friends on the same WiFi can play via IP address
    host: '0.0.0.0', 
  }
})