/**
 * 生成应用图标 build/icon.png（512x512）
 * 纯 Node 实现（zlib + 手写 PNG 编码），无需任何图像依赖。
 * 图案：深色圆角底板 + 两张翻页卡片（"12"）+ 中缝铰链 + 琥珀色指示灯
 * 用法：node scripts/gen-icon.mjs
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SIZE = 512
const SS = 3 // 超采样倍数，用于抗锯齿

/* ---------------- 几何工具：圆角矩形 SDF ---------------- */
function inRoundRect(px, py, x0, y0, x1, y1, r) {
  const cx = Math.min(Math.max(px, x0 + r), x1 - r)
  const cy = Math.min(Math.max(py, y0 + r), y1 - r)
  const dx = px - cx
  const dy = py - cy
  return px >= x0 && px <= x1 && py >= y0 && py <= y1 && dx * dx + dy * dy <= r * r
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)

/* ---------------- 图案定义 ---------------- */
const BG_TOP = hex('#2c3039')
const BG_BOTTOM = hex('#111318')
const CARD_TOP = hex('#3a3e48')
const CARD_BOTTOM = hex('#262930')
const DIGIT = hex('#f0ede5')
const HINGE = hex('#0b0c0f')
const ACCENT = hex('#ffb547')

const CARDS = [
  { x0: 92, x1: 244 },
  { x0: 268, x1: 420 },
]
const CARD_Y0 = 128
const CARD_Y1 = 400
const HINGE_Y = 264
const T = 26 // 数码段粗细

/** 七段数码管风格的数字段（相对卡片） */
function digitSegments(digit, x0, x1) {
  const y0 = 172
  const y1 = 356
  const ym = (y0 + y1) / 2
  const h = T / 2
  const seg = {
    a: [x0, y0, x1, y0 + T],
    g: [x0, ym - h, x1, ym + h],
    d: [x0, y1 - T, x1, y1],
    f: [x0, y0, x0 + T, ym + h],
    b: [x1 - T, y0, x1, ym + h],
    e: [x0, ym - h, x0 + T, y1],
    c: [x1 - T, ym - h, x1, y1],
  }
  if (digit === '1') {
    const cx = (x0 + x1) / 2 + 6
    return [
      [cx - h, y0, cx + h, y1],
      [cx - h - 22, y0, cx + h, y0 + T],
    ]
  }
  const map = { 2: 'abged' }
  return map[digit].split('').map((k) => seg[k])
}

const DIGITS = [digitSegments('1', CARDS[0].x0 + 38, CARDS[0].x1 - 38), digitSegments('2', CARDS[1].x0 + 38, CARDS[1].x1 - 38)]

/** 计算单个采样点的颜色 [r,g,b,a] */
function shade(x, y) {
  // 底板
  if (!inRoundRect(x, y, 16, 16, 496, 496, 108)) return [0, 0, 0, 0]
  let c = mix(BG_TOP, BG_BOTTOM, (y - 16) / 480)

  // 指示灯光晕
  const ld = Math.hypot(x - 256, y - 78)
  if (ld < 46) c = mix(c, ACCENT, Math.max(0, 1 - ld / 46) ** 2 * 0.45)
  if (ld < 13) c = mix(ACCENT, [255, 240, 210], Math.max(0, 1 - ld / 7) * 0.6)

  for (let i = 0; i < CARDS.length; i++) {
    const { x0, x1 } = CARDS[i]
    // 卡片投影
    if (inRoundRect(x, y, x0 + 4, CARD_Y0 + 14, x1 - 4, CARD_Y1 + 14, 26)) c = mix(c, [0, 0, 0], 0.35)
    if (!inRoundRect(x, y, x0, CARD_Y0, x1, CARD_Y1, 24)) continue
    c = y < HINGE_Y ? mix(CARD_TOP, mix(CARD_TOP, CARD_BOTTOM, 0.3), (y - CARD_Y0) / (HINGE_Y - CARD_Y0)) : CARD_BOTTOM
    if (y < CARD_Y0 + 3) c = mix(c, [255, 255, 255], 0.12) // 顶部高光
    for (const [sx0, sy0, sx1, sy1] of DIGITS[i]) {
      if (inRoundRect(x, y, sx0, sy0, sx1, sy1, 5)) c = y > HINGE_Y ? mix(DIGIT, [0, 0, 0], 0.08) : DIGIT
    }
    if (Math.abs(y - HINGE_Y) < 3) c = HINGE // 中缝
  }
  return [...c, 255]
}

/* ---------------- 光栅化（超采样抗锯齿） ---------------- */
const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE)
for (let py = 0; py < SIZE; py++) {
  raw[py * (SIZE * 4 + 1)] = 0 // 每行的 PNG filter 类型：None
  for (let px = 0; px < SIZE; px++) {
    let r = 0
    let g = 0
    let b = 0
    let a = 0
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const [cr, cg, cb, ca] = shade(px + (sx + 0.5) / SS, py + (sy + 0.5) / SS)
        r += cr * ca
        g += cg * ca
        b += cb * ca
        a += ca
      }
    }
    const o = py * (SIZE * 4 + 1) + 1 + px * 4
    raw[o] = a ? Math.round(r / a) : 0
    raw[o + 1] = a ? Math.round(g / a) : 0
    raw[o + 2] = a ? Math.round(b / a) : 0
    raw[o + 3] = Math.round(a / (SS * SS))
  }
}

/* ---------------- PNG 编码 ---------------- */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8 // 位深
ihdr[9] = 6 // RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'build', 'icon.png')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, png)
console.log(`图标已生成：${out}`)
