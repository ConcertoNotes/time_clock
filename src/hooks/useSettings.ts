import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_ZONE, isKnownZone } from '../lib/timezones'
import { clampScale } from '../lib/layout'

export type ThemeId = 'graphite' | 'retro' | 'neon'

export const THEMES: { id: ThemeId; name: string }[] = [
  { id: 'graphite', name: '石墨' },
  { id: 'retro', name: '复古' },
  { id: 'neon', name: '霓虹' },
]

export interface Settings {
  timeZone: string
  hour12: boolean
  showSeconds: boolean
  theme: ThemeId
  /** 面板背景不透明度 0.1 ~ 1（翻页卡片本身始终不透明） */
  opacity: number
  /** 整体缩放比例 */
  scale: number
}

const STORAGE_KEY = 'flipclock.settings.v1'

export const DEFAULT_SETTINGS: Settings = {
  timeZone: DEFAULT_ZONE,
  hour12: false,
  showSeconds: true,
  theme: 'graphite',
  opacity: 0.72,
  scale: 1,
}

/** 读取并校验本地存储，任何字段异常都回退为默认值 */
function load(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Settings>
    return {
      timeZone: isKnownZone(raw.timeZone) ? raw.timeZone : DEFAULT_SETTINGS.timeZone,
      hour12: typeof raw.hour12 === 'boolean' ? raw.hour12 : DEFAULT_SETTINGS.hour12,
      showSeconds: typeof raw.showSeconds === 'boolean' ? raw.showSeconds : DEFAULT_SETTINGS.showSeconds,
      theme: THEMES.some((t) => t.id === raw.theme) ? (raw.theme as ThemeId) : DEFAULT_SETTINGS.theme,
      opacity: typeof raw.opacity === 'number' ? Math.min(1, Math.max(0.1, raw.opacity)) : DEFAULT_SETTINGS.opacity,
      scale: typeof raw.scale === 'number' ? clampScale(raw.scale) : DEFAULT_SETTINGS.scale,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // 存储不可用时静默忽略，不影响时钟运行
    }
  }, [settings])

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), [])

  return { settings, update, reset }
}
