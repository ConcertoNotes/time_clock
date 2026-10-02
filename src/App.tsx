import { useCallback, useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react'
import { ChevronDown, Minus, Pin, PinOff, Settings2, X } from 'lucide-react'
import { FlipClock } from './components/FlipClock'
import { ZonePicker } from './components/ZonePicker'
import { SettingsPanel } from './components/SettingsPanel'
import { useNow } from './hooks/useNow'
import { useSettings } from './hooks/useSettings'
import { desktopApi, isDesktop, useDesktopState, useWindowFocus } from './hooks/useDesktop'
import { ZONES, getZone } from './lib/timezones'
import {
  formatDate,
  formatDiffFromBeijing,
  formatOffset,
  getClockDigits,
  getMeridiem,
  getZonedTime,
  weekdayCn,
  weekdayEn,
} from './lib/time'
import { clampScale, getWidthRem, getWindowSize } from './lib/layout'

type Overlay = 'zones' | 'settings' | null

export default function App() {
  const now = useNow()
  const { settings, update, reset } = useSettings()
  const { state: desk, setAlwaysOnTop, setOpenAtLogin } = useDesktopState()
  const focused = useWindowFocus()
  const [overlay, setOverlay] = useState<Overlay>(null)

  const zone = getZone(settings.timeZone)
  const time = getZonedTime(now, settings.timeZone)
  const digits = getClockDigits(time, settings.hour12)

  /* ---------- 主题 / 透明度 / 布局宽度 写入根元素 ---------- */
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = settings.theme
    root.style.setProperty('--alpha', String(settings.opacity))
    root.style.setProperty('--wrem', String(getWidthRem(settings.showSeconds)))
  }, [settings.theme, settings.opacity, settings.showSeconds])

  /* ---------- 缩放 / 显示秒数变化时调整窗口尺寸 ---------- */
  useEffect(() => {
    const { width, height } = getWindowSize(settings.scale, settings.showSeconds)
    desktopApi?.setSize(width, height)
  }, [settings.scale, settings.showSeconds])

  /** 按列表顺序切换到上一个 / 下一个时区 */
  const cycleZone = useCallback(
    (step: number) => {
      const i = ZONES.findIndex((z) => z.id === settings.timeZone)
      const next = ZONES[(i + step + ZONES.length) % ZONES.length]
      update('timeZone', next.id)
    },
    [settings.timeZone, update],
  )

  const toggleOverlay = (next: Exclude<Overlay, null>) => setOverlay((cur) => (cur === next ? null : next))

  /* ---------- 键盘快捷键 ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return setOverlay(null)
      // 在搜索框中输入时不触发快捷键
      if (e.target instanceof HTMLInputElement && e.target.type === 'text') return

      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') update('scale', clampScale(settings.scale + 0.1))
        else if (e.key === '-') update('scale', clampScale(settings.scale - 0.1))
        else if (e.key === '0') update('scale', 1)
        else return
        e.preventDefault()
        return
      }

      switch (e.key.toLowerCase()) {
        case 'z':
          toggleOverlay('zones')
          break
        case 's':
        case ',':
          toggleOverlay('settings')
          break
        case 'arrowleft':
          if (!overlay) cycleZone(-1)
          break
        case 'arrowright':
          if (!overlay) cycleZone(1)
          break
        case 'p':
          setAlwaysOnTop(!desk.alwaysOnTop)
          break
        case 'h':
          update('hour12', !settings.hour12)
          break
        default:
          return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settings.scale, settings.hour12, desk.alwaysOnTop, overlay, cycleZone, update, setAlwaysOnTop])

  /* ---------- 拖拽窗口：按下面板空白处拖动（按钮等交互元素除外） ---------- */
  const [dragging, setDragging] = useState(false)
  const draggingRef = useRef(false)

  const onPanelPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (!desktopApi || e.button !== 0) return
    if ((e.target as HTMLElement).closest('button, input, a')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = true
    setDragging(true)
    desktopApi.dragStart()
  }

  const endDrag = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setDragging(false)
    desktopApi?.dragEnd()
  }

  /** 在时区胶囊上滚动滚轮快速切换城市 */
  const onCapsuleWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaY) < 4) return
    cycleZone(e.deltaY > 0 ? 1 : -1)
  }

  return (
    <div
      className="app-root h-full"
      data-focused={focused}
      onContextMenu={(e) => {
        if (e.target instanceof HTMLInputElement) return
        e.preventDefault()
        desktopApi?.showContextMenu()
      }}
    >
      <main
        className="panel"
        data-draggable={isDesktop}
        data-dragging={dragging}
        onPointerDown={onPanelPointerDown}
        onPointerUp={endDrag}
        onLostPointerCapture={endDrag}
      >
        {/* ---------- 顶栏：时区胶囊 + 窗口操作 ---------- */}
        <header className="flex h-[1.75rem] shrink-0 items-center justify-between">
          <button
            className="zone-capsule"
            aria-expanded={overlay === 'zones'}
            title="切换时区（Z / ← → / 滚轮）"
            onClick={() => toggleOverlay('zones')}
            onWheel={onCapsuleWheel}
          >
            <span className="led" />
            <span className="font-medium tracking-[0.14em]">{zone.en.toUpperCase()}</span>
            <span className="text-(--text-dim)">{zone.city}</span>
            <ChevronDown className="h-[0.7rem] w-[0.7rem] text-(--text-dim)" />
          </button>

          <div className="window-actions flex items-center gap-0.5">
            <button
              className="icon-btn"
              data-active={desk.alwaysOnTop}
              title={desk.alwaysOnTop ? '取消置顶 (P)' : '窗口置顶 (P)'}
              onClick={() => setAlwaysOnTop(!desk.alwaysOnTop)}
            >
              {desk.alwaysOnTop ? <Pin /> : <PinOff />}
            </button>
            <button className="icon-btn" title="设置 (S)" onClick={() => toggleOverlay('settings')}>
              <Settings2 />
            </button>
            {isDesktop && (
              <>
                <button className="icon-btn" title="隐藏到托盘" onClick={() => desktopApi?.minimize()}>
                  <Minus />
                </button>
                <button className="icon-btn" data-danger title="关闭" onClick={() => desktopApi?.close()}>
                  <X />
                </button>
              </>
            )}
          </div>
        </header>

        {/* ---------- 翻页时钟 ---------- */}
        <section className="flex min-h-0 flex-1 items-center justify-center">
          <FlipClock
            digits={digits}
            showSeconds={settings.showSeconds}
            timeZone={settings.timeZone}
            meridiem={settings.hour12 ? getMeridiem(time) : null}
          />
        </section>

        {/* ---------- 底栏：日期 / 星期 / UTC 偏移 / 与北京时差 ---------- */}
        <footer className="statusbar">
          <span>
            {formatDate(time)} <b>{weekdayEn(time)}</b> {weekdayCn(time)}
          </span>
          <span>
            {formatOffset(time.offsetMinutes)} · {formatDiffFromBeijing(time.offsetMinutes)}
          </span>
        </footer>
      </main>

      {overlay === 'zones' && (
        <ZonePicker
          now={now}
          current={settings.timeZone}
          hour12={settings.hour12}
          onSelect={(id) => update('timeZone', id)}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === 'settings' && (
        <SettingsPanel
          settings={settings}
          desktop={desk}
          isDesktop={isDesktop}
          onChange={update}
          onAlwaysOnTop={setAlwaysOnTop}
          onOpenAtLogin={setOpenAtLogin}
          onReset={reset}
          onClose={() => setOverlay(null)}
        />
      )}
    </div>
  )
}
