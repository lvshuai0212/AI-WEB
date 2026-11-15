// 后台（robot-admin）专用的外置 Vite 配置。
// 作用：不依赖 robot-admin/vite.config.js，规避部分电脑上配置加载失败导致的后台白屏。
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const here = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(here, '..', 'robot-admin')
const requireFromRoot = createRequire(path.join(ROOT, 'package.json'))

const vue = requireFromRoot('@vitejs/plugin-vue')
const { defineConfig } = requireFromRoot('vite')

export default defineConfig({
  root: ROOT,
  plugins: [vue.default ? vue.default() : vue()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.API_TARGET || 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '')
      }
    }
  }
})
