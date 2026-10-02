import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { RotateCcw, Settings2, X } from 'lucide-react'
import { THEMES, type Settings, type ThemeId } from '../hooks/useSettings'
import { SCALE_MAX, SCALE_MIN } from '../lib/layout'
import type { DesktopState } from '../types/desktop'

interface SettingsPanelProps {
  settings: Settings
  desktop: DesktopState
  isDesktop: boolean
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  onAlwaysOnTop: (flag: boolean) => void
  onOpenAtLogin: (flag: boolean) => void
  onReset: () => void
  onClose: () => void
}

/** 各主题的色板预览（卡片底色 + 指示灯颜色） */
const SWATCH: Record<ThemeId, string> = {
  graphite: 'linear-gradient(135deg, #30333b 55%, #ffb547 55%)',
  retro: 'linear-gradient(135deg, #2f2722 55%, #ff7a45 55%)',
  neon: 'linear-gradient(135deg, #141d30 55%, #3de0ff 55%)',
}

export function SettingsPanel({
  settings,
  desktop,
  isDesktop,
  onChange,
  onAlwaysOnTop,
  onOpenAtLogin,
  onReset,
  onClose,
}: SettingsPanelProps) {
  return (
    <div className="overlay" role="dialog" aria-label="设置">
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="overlay-title">
          <Settings2 />
          设置
        </h2>
        <div className="flex items-center gap-1">
          <button className="icon-btn" title="恢复默认设置" onClick={onReset}>
            <RotateCcw />
          </button>
          <button className="icon-btn" title="关闭 (Esc)" onClick={onClose}>
            <X />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
        <Row label="窗口置顶">
          <Switch checked={desktop.alwaysOnTop} onChange={onAlwaysOnTop} disabled={!isDesktop} />
        </Row>
        <Row label="12 小时制">
          <Switch checked={settings.hour12} onChange={(v) => onChange('hour12', v)} />
        </Row>
        <Row label="显示秒数">
          <Switch checked={settings.showSeconds} onChange={(v) => onChange('showSeconds', v)} />
        </Row>
        <Row label="开机自启" hint={desktop.loginItemSupported ? undefined : '打包后可用'}>
          <Switch
            checked={desktop.openAtLogin}
            onChange={onOpenAtLogin}
            disabled={!desktop.loginItemSupported}
          />
        </Row>
        <Row label="背景透明度">
          <Range
            min={0.1}
            max={1}
            step={0.02}
            value={settings.opacity}
            onChange={(v) => onChange('opacity', v)}
            format={(v) => `${Math.round(v * 100)}%`}
          />
        </Row>
        <Row label="尺寸">
          <Range
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={0.05}
            value={settings.scale}
            onChange={(v) => onChange('scale', v)}
            format={(v) => `${Math.round(v * 100)}%`}
            disabled={!isDesktop}
            // 缩放会改变窗口尺寸、滑块随之移位；若拖动中实时缩放会形成反馈循环，数值在两端来回跳
            commitOnRelease
          />
        </Row>
        <Row label="主题">
          <div className="flex gap-2" role="radiogroup" aria-label="主题">
            {THEMES.map((t) => (
              <button
                key={t.id}
                role="radio"
                aria-checked={settings.theme === t.id}
                title={t.name}
                className="swatch"
                style={{ background: SWATCH[t.id] }}
                onClick={() => onChange('theme', t.id)}
              />
            ))}
          </div>
        </Row>
      </div>

      <p className="mt-auto pt-1.5 text-[0.48rem] leading-relaxed text-(--text-dim)">
        <kbd>Z</kbd> 时区 · <kbd>←</kbd>
        <kbd>→</kbd> 切换城市 · <kbd>P</kbd> 置顶 · <kbd>H</kbd> 12/24 · <kbd>Ctrl</kbd>+<kbd>+/−</kbd> 缩放 ·{' '}
        <kbd>Esc</kbd> 关闭 · 右键更多
      </p>
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="setting-row">
      <span className="truncate">
        {label}
        {hint && <small>{hint}</small>}
      </span>
      {children}
    </div>
  )
}

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className="switch"
      onClick={() => onChange(!checked)}
    />
  )
}

function Range({
  min,
  max,
  step,
  value,
  onChange,
  format,
  disabled,
  commitOnRelease = false,
}: {
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  format: (v: number) => string
  disabled?: boolean
  /** 松开鼠标 / 按键后才提交数值（拖动过程中只更新滑块自身的显示） */
  commitOnRelease?: boolean
}) {
  // 拖动中的草稿值；null 表示没有未提交的改动
  const [draft, setDraft] = useState<number | null>(null)
  const draftRef = useRef<number | null>(null)
  const shown = draft ?? value

  const commit = () => {
    const v = draftRef.current
    if (v === null) return
    draftRef.current = null
    setDraft(null)
    onChange(v)
  }

  // 鼠标在滑块外松开时也要提交
  useEffect(() => {
    if (draft === null) return
    window.addEventListener('pointerup', commit)
    return () => window.removeEventListener('pointerup', commit)
  })

  const fill = `${((shown - min) / (max - min)) * 100}%`
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={shown}
        disabled={disabled}
        style={{ '--fill': fill } as CSSProperties}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (!commitOnRelease) return onChange(v)
          draftRef.current = v
          setDraft(v)
        }}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
      />
      <span className="w-[1.9rem] text-right text-[0.55rem] tabular-nums text-(--text-dim)">{format(shown)}</span>
    </div>
  )
}
