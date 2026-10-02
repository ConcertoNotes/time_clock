import { useMemo, useState } from 'react'
import { Globe, Search, X } from 'lucide-react'
import { FAVORITE_ZONES, ZONES, getZone } from '../lib/timezones'
import { formatOffsetShort, formatShortTime, getZonedTime } from '../lib/time'

interface ZonePickerProps {
  now: Date
  current: string
  hour12: boolean
  onSelect: (id: string) => void
  onClose: () => void
}

/** 时区选择器：常用胶囊 + 可搜索的城市网格（按 UTC 偏移排序，并实时显示各地时间） */
export function ZonePicker({ now, current, hour12, onSelect, onClose }: ZonePickerProps) {
  const [query, setQuery] = useState('')

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ZONES.map((zone) => ({ zone, time: getZonedTime(now, zone.id) }))
      .filter(({ zone }) =>
        !q ? true : [zone.city, zone.en, zone.country, zone.code, zone.id].some((s) => s.toLowerCase().includes(q)),
      )
      .sort((a, b) => a.time.offsetMinutes - b.time.offsetMinutes)
  }, [now, query])

  const choose = (id: string) => {
    onSelect(id)
    onClose()
  }

  return (
    <div className="overlay" role="dialog" aria-label="选择时区">
      <div className="mb-2 flex items-center gap-3">
        <h2 className="overlay-title shrink-0">
          <Globe />
          选择时区
        </h2>
        <label className="search-box flex-1">
          <Search />
          <input
            autoFocus
            value={query}
            placeholder="搜索城市 / 国家 / 时区…"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && items[0]) choose(items[0].zone.id)
            }}
          />
        </label>
        <button className="icon-btn" title="关闭 (Esc)" onClick={onClose}>
          <X />
        </button>
      </div>

      {!query && (
        <div className="mb-2 flex gap-1.5 overflow-hidden">
          {FAVORITE_ZONES.map((id) => (
            <button key={id} className="chip" data-active={id === current} onClick={() => choose(id)}>
              {getZone(id).city}
            </button>
          ))}
        </div>
      )}

      <div className="zone-grid min-h-0 flex-1">
        {items.map(({ zone, time }) => (
          <button
            key={zone.id}
            className="zone-item"
            data-active={zone.id === current}
            title={zone.id}
            onClick={() => choose(zone.id)}
          >
            <span className="zone-code">{zone.code}</span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-[0.62rem]">
                {zone.city}
                <span className="ml-1 text-[0.5rem] text-(--text-dim)">{zone.country}</span>
              </span>
              <span className="truncate text-[0.48rem] tracking-wide text-(--text-dim)">
                {zone.en.toUpperCase()} · {formatOffsetShort(time.offsetMinutes)}
              </span>
            </span>
            <span className="font-digit text-[0.95rem] font-semibold tabular-nums text-(--accent)">
              {formatShortTime(time, hour12)}
            </span>
          </button>
        ))}
        {items.length === 0 && (
          <p className="col-span-full py-4 text-center text-[0.6rem] text-(--text-dim)">没有匹配的城市</p>
        )}
      </div>
    </div>
  )
}
