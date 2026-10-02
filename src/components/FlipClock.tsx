import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { FlipDigit } from './FlipDigit'

interface FlipClockProps {
  /** [时, 分, 秒]，每项两位字符串 */
  digits: [string, string, string]
  showSeconds: boolean
  /** 当前时区，切换时触发级联翻页 */
  timeZone: string
  /** 12 小时制下的 AM / PM，24 小时制传 null */
  meridiem: 'AM' | 'PM' | null
}

/** 级联翻页时相邻卡片之间的间隔（6 张卡最大延迟 250ms + 翻页 675ms，保证在下一秒到来前完成） */
const CASCADE_STEP_MS = 50

export function FlipClock({ digits, showSeconds, timeZone, meridiem }: FlipClockProps) {
  // 检测时区是否在本次渲染中发生变化：是则让各卡片依次延迟翻转，形成“多米诺”式过渡
  const prevZone = useRef(timeZone)
  const cascade = prevZone.current !== timeZone
  useEffect(() => {
    prevZone.current = timeZone
  })

  const groups = showSeconds ? digits : digits.slice(0, 2)
  let index = 0

  return (
    <div className="flex items-center justify-center" role="timer" aria-live="off" aria-label={groups.join(':')}>
      {groups.map((pair, gi) => (
        <div key={gi} className="flex items-center">
          {gi > 0 && <Colon />}
          <div className="relative flex gap-[0.375rem]">
            {pair.split('').map((ch, di) => {
              const delay = cascade ? index * CASCADE_STEP_MS : 0
              index += 1
              return <FlipDigit key={di} value={ch} delay={delay} />
            })}
            {gi === 0 && meridiem && <span className="flip-meridiem">{meridiem}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

/** 冒号分隔符：两颗带辉光的指示灯，随秒呼吸闪烁 */
function Colon() {
  // 用负的 animation-delay 把 1s 循环动画的相位对齐到系统时钟的整秒
  const [phase] = useState(() => -(Date.now() % 1000))
  return (
    <div className="flip-colon" style={{ '--colon-phase': `${phase}ms` } as CSSProperties} aria-hidden="true">
      <span />
      <span />
    </div>
  )
}
