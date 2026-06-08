import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// FxOs frontend dev sunucusu.
// Cookie tabanlı auth'ta CORS'tan kaçınmak için dev'de '/api' isteklerini
// local API'ye proxy'leriz (aynı-origin gibi davranır). Hedef env ile ayarlanır.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5137'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
