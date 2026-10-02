import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 本地字体（离线可用，不依赖网络 CDN）
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'
import './index.css'
import App from './App'

// 浏览器预览模式（无 Electron）下补一张桌面背景，便于查看玻璃面板效果
if (!window.desktop) document.documentElement.classList.add('is-web')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
