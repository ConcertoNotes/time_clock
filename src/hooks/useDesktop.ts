import { useCallback, useEffect, useState } from 'react'
import type { DesktopState } from '../types/desktop'

const desktop = typeof window !== 'undefined' ? window.desktop : undefined

/** 是否运行在 Electron 中（浏览器预览模式下为 false） */
export const isDesktop = Boolean(desktop)

/** 同步主进程的窗口状态（置顶 / 开机自启），并提供修改方法 */
export function useDesktopState() {
  const [state, setState] = useState<DesktopState>({
    alwaysOnTop: false,
    openAtLogin: false,
    loginItemSupported: false,
    platform: desktop?.platform ?? 'web',
  })

  useEffect(() => {
    if (!desktop) return
    desktop.getState().then(setState)
    return desktop.onStateChange(setState)
  }, [])

  const setAlwaysOnTop = useCallback((flag: boolean) => {
    if (desktop) desktop.setAlwaysOnTop(flag).then(setState)
    else setState((s) => ({ ...s, alwaysOnTop: flag }))
  }, [])

  const setOpenAtLogin = useCallback((flag: boolean) => {
    desktop?.setOpenAtLogin(flag).then(setState)
  }, [])

  return { state, setAlwaysOnTop, setOpenAtLogin }
}

/** 窗口是否获得焦点：失焦时隐藏操作按钮，让摆件更“干净” */
export function useWindowFocus(): boolean {
  const [focused, setFocused] = useState(() => document.hasFocus())
  useEffect(() => {
    const onFocus = () => setFocused(true)
    const onBlur = () => setFocused(false)
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
    }
  }, [])
  return focused
}

export const desktopApi = desktop
