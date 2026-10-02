/** 主进程推送给渲染进程的窗口状态 */
export interface DesktopState {
  alwaysOnTop: boolean
  openAtLogin: boolean
  loginItemSupported: boolean
  platform: string
}

/** preload.cjs 通过 contextBridge 暴露的桌面 API */
export interface DesktopApi {
  platform: string
  getState(): Promise<DesktopState>
  setAlwaysOnTop(flag: boolean): Promise<DesktopState>
  setOpenAtLogin(flag: boolean): Promise<DesktopState>
  setSize(width: number, height: number): void
  dragStart(): void
  dragEnd(): void
  minimize(): void
  close(): void
  showContextMenu(): void
  onStateChange(callback: (state: DesktopState) => void): () => void
}

declare global {
  interface Window {
    /** 仅在 Electron 中存在；纯浏览器预览（npm run dev:web）时为 undefined */
    desktop?: DesktopApi
  }
}
