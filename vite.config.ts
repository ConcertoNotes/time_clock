import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * 仅在生产构建时注入严格的 CSP（内容安全策略）。
 * 开发模式下 React Fast Refresh 需要内联脚本，严格 CSP 会阻断它。
 */
function injectCsp(): Plugin {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data:",
  ].join('; ')
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head' },
    ],
  }
}

// https://vite.dev/config/
export default defineConfig({
  // 使用相对路径，保证 Electron 以 file:// 协议加载打包产物时资源路径正确
  base: './',
  plugins: [react(), tailwindcss(), injectCsp()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    // 忽略打包输出目录：否则 Windows 上文件监听会占用目录句柄，导致 electron-builder 重命名失败（EPERM）
    watch: { ignored: ['**/release/**', '**/build/**'] },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome130',
  },
})
