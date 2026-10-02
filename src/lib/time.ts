/**
 * 时区转换逻辑
 * 完全基于浏览器内置的 Intl.DateTimeFormat（ICU 时区数据库），
 * 自动处理夏令时（DST），无需引入 moment-timezone 等第三方库。
 */

export interface ZonedTime {
  year: number
  month: number // 1-12
  day: number
  hours: number // 0-23
  minutes: number
  seconds: number
  weekday: number // 0=周日 … 6=周六
  /** 相对 UTC 的偏移（分钟），例如北京时间为 +480 */
  offsetMinutes: number
}

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
const WEEKDAY_CN = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const WEEKDAY_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MINUS = '−' // 排版用的减号，比连字符更宽、与加号等宽

// Intl.DateTimeFormat 的构造开销较大，按时区缓存实例（每秒都会调用）
const formatterCache = new Map<string, Intl.DateTimeFormat>()

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let fmt = formatterCache.get(timeZone)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23', // 避免部分实现在午夜输出 "24"
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
      timeZoneName: 'longOffset', // 输出形如 "GMT+08:00"，用于计算 UTC 偏移
    })
    formatterCache.set(timeZone, fmt)
  }
  return fmt
}

/** 解析 "GMT+08:00" / "GMT-03:30" / "GMT" 为分钟偏移 */
function parseOffset(text: string): number {
  const m = /GMT([+-])(\d{1,2})(?::?(\d{2}))?/.exec(text)
  if (!m) return 0
  const sign = m[1] === '-' ? -1 : 1
  return sign * (Number(m[2]) * 60 + Number(m[3] ?? 0))
}

/** 将某个时间点转换为指定时区的“墙上时间” */
export function getZonedTime(date: Date, timeZone: string): ZonedTime {
  const parts = getFormatter(timeZone).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hours: Number(get('hour')) % 24,
    minutes: Number(get('minute')),
    seconds: Number(get('second')),
    weekday: WEEKDAY_INDEX[get('weekday')] ?? 0,
    offsetMinutes: parseOffset(get('timeZoneName')),
  }
}

export const pad2 = (n: number) => String(n).padStart(2, '0')

/** 时钟要显示的数字 [时, 分, 秒]，每项两位 */
export function getClockDigits(t: ZonedTime, hour12: boolean): [string, string, string] {
  const h = hour12 ? t.hours % 12 || 12 : t.hours
  return [pad2(h), pad2(t.minutes), pad2(t.seconds)]
}

export function getMeridiem(t: ZonedTime): 'AM' | 'PM' {
  return t.hours < 12 ? 'AM' : 'PM'
}

/** 偏移格式化：+480 → "UTC+08:00" */
export function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? MINUS : '+'
  const abs = Math.abs(offsetMinutes)
  return `UTC${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`
}

/** 简短偏移：+480 → "+8"，+330 → "+5:30" */
export function formatOffsetShort(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? MINUS : '+'
  const abs = Math.abs(offsetMinutes)
  const mm = abs % 60
  return `${sign}${Math.floor(abs / 60)}${mm ? `:${pad2(mm)}` : ''}`
}

/** 与北京时间的时差描述：-720 → "较北京 −12h"；-150 → "较北京 −2.5h" */
export function formatDiffFromBeijing(offsetMinutes: number): string {
  const diff = offsetMinutes - 480
  if (diff === 0) return '与北京同步'
  const hours = Math.abs(diff) / 60
  const text = Number.isInteger(hours) ? String(hours) : String(Math.round(hours * 100) / 100)
  return `较北京 ${diff < 0 ? MINUS : '+'}${text}h`
}

export function formatDate(t: ZonedTime): string {
  return `${t.year}.${pad2(t.month)}.${pad2(t.day)}`
}

export function weekdayCn(t: ZonedTime): string {
  return WEEKDAY_CN[t.weekday]
}

export function weekdayEn(t: ZonedTime): string {
  return WEEKDAY_EN[t.weekday]
}

/** 简短的 HH:mm，用于时区选择器里每个城市的实时预览 */
export function formatShortTime(t: ZonedTime, hour12: boolean): string {
  const [h, m] = getClockDigits(t, hour12)
  return `${h}:${m}`
}
