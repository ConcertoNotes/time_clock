/** 时区选项 */
export interface ZoneOption {
  /** IANA 时区标识，如 Asia/Shanghai */
  id: string
  /** 中文城市名 */
  city: string
  /** 英文城市名（用于极客风格的大写标签） */
  en: string
  /** 国家 / 地区 */
  country: string
  /** 国家 / 地区代码（Windows 不渲染国旗 emoji，用代码徽标代替） */
  code: string
}

/** 默认时区：北京时间 */
export const DEFAULT_ZONE = 'Asia/Shanghai'

/** 常用时区（选择器顶部的快捷胶囊） */
export const FAVORITE_ZONES = [
  'Asia/Shanghai',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Asia/Tokyo',
]

export const ZONES: ZoneOption[] = [
  { id: 'Asia/Shanghai', city: '北京', en: 'Beijing', country: '中国', code: 'CN' },
  { id: 'America/New_York', city: '纽约', en: 'New York', country: '美国', code: 'US' },
  { id: 'America/Los_Angeles', city: '洛杉矶', en: 'Los Angeles', country: '美国', code: 'US' },
  { id: 'Europe/London', city: '伦敦', en: 'London', country: '英国', code: 'GB' },
  { id: 'Asia/Tokyo', city: '东京', en: 'Tokyo', country: '日本', code: 'JP' },
  { id: 'Asia/Hong_Kong', city: '香港', en: 'Hong Kong', country: '中国', code: 'HK' },
  { id: 'Asia/Seoul', city: '首尔', en: 'Seoul', country: '韩国', code: 'KR' },
  { id: 'Asia/Singapore', city: '新加坡', en: 'Singapore', country: '新加坡', code: 'SG' },
  { id: 'Asia/Bangkok', city: '曼谷', en: 'Bangkok', country: '泰国', code: 'TH' },
  { id: 'Asia/Kolkata', city: '新德里', en: 'New Delhi', country: '印度', code: 'IN' },
  { id: 'Asia/Dubai', city: '迪拜', en: 'Dubai', country: '阿联酋', code: 'AE' },
  { id: 'Europe/Moscow', city: '莫斯科', en: 'Moscow', country: '俄罗斯', code: 'RU' },
  { id: 'Europe/Paris', city: '巴黎', en: 'Paris', country: '法国', code: 'FR' },
  { id: 'Europe/Berlin', city: '柏林', en: 'Berlin', country: '德国', code: 'DE' },
  { id: 'America/Chicago', city: '芝加哥', en: 'Chicago', country: '美国', code: 'US' },
  { id: 'America/Toronto', city: '多伦多', en: 'Toronto', country: '加拿大', code: 'CA' },
  { id: 'America/Sao_Paulo', city: '圣保罗', en: 'Sao Paulo', country: '巴西', code: 'BR' },
  { id: 'Australia/Sydney', city: '悉尼', en: 'Sydney', country: '澳大利亚', code: 'AU' },
  { id: 'Pacific/Auckland', city: '奥克兰', en: 'Auckland', country: '新西兰', code: 'NZ' },
  { id: 'UTC', city: '协调世界时', en: 'UTC', country: '世界', code: 'UTC' },
]

const ZONE_MAP = new Map(ZONES.map((z) => [z.id, z]))

export function getZone(id: string): ZoneOption {
  return ZONE_MAP.get(id) ?? ZONE_MAP.get(DEFAULT_ZONE)!
}

export function isKnownZone(id: unknown): id is string {
  return typeof id === 'string' && ZONE_MAP.has(id)
}
