import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 端口可配置：ADMIN_PORT 控制后台自身端口，API_TARGET 指向服务端地址
// 例：换服务端到 3001 时，启动前设置 API_TARGET=http://localhost:3001
export default defineConfig({
  plugins: [vue()],
  server: {
    port: Number(process.env.ADMIN_PORT) || 5173,
    proxy: {
      '/api': {
        target: process.env.API_TARGET || 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
