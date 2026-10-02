import { memo, useState, type AnimationEvent, type CSSProperties } from 'react'

interface FlipDigitProps {
  value: string
  /** 翻页延迟（ms），切换时区时用于制造从左到右的级联翻页 */
  delay?: number
}

interface FlipState {
  current: string
  previous: string
  /** 每次翻页递增，作为翻页层的 key 以重启 CSS 动画 */
  flips: number
  delay: number
}

/**
 * 单个 3D 机械翻页数字卡片
 *
 * 一张卡片由 4 个“半片”叠成（数字写在 200% 高的 span 里，半片用 overflow:hidden 只露出上/下半部分）：
 *
 *   ┌──────────────┐  ① 静态上半片：显示【新】数字上半部分（被翻转上片盖住，翻起后露出）
 *   │   ③ 翻转上片   │  ③ 翻转上片：显示【旧】数字上半部分，绕底边 0° → -90° 向前倒下
 *   ├──────────────┤  ← 铰链（hinge）
 *   │   ④ 翻转下片   │  ④ 翻转下片：显示【新】数字下半部分，绕顶边 90° → 0° 落下并带轻微回弹
 *   └──────────────┘  ② 静态下半片：显示【旧】数字下半部分，直到翻转下片落下覆盖它
 *
 * 光影：每个半片里有一层 .flip-shade 渐变遮罩，随翻转角度同步变暗/变亮，模拟真实光照。
 */
export const FlipDigit = memo(function FlipDigit({ value, delay = 0 }: FlipDigitProps) {
  const [state, setState] = useState<FlipState>({ current: value, previous: value, flips: 0, delay: 0 })

  // “渲染期间派生状态”模式：值变化时同步记录旧值并开始翻页，避免 useEffect 带来的一帧闪烁
  if (state.current !== value) {
    setState({ current: value, previous: state.current, flips: state.flips + 1, delay })
  }

  const flipping = state.previous !== state.current

  const handleFlipEnd = (e: AnimationEvent<HTMLDivElement>) => {
    // 遮罩层的动画事件会冒泡上来，只处理翻转下片自身的动画结束
    if (e.target !== e.currentTarget) return
    setState((s) => (s.previous === s.current ? s : { ...s, previous: s.current }))
  }

  const style = { '--flip-delay': `${state.delay}ms` } as CSSProperties

  return (
    <div className="flip-card" style={style} aria-hidden="true">
      {/* ① 静态上半片：新值 */}
      <div className="flip-half flip-half--top">
        <span className="flip-glyph">{state.current}</span>
        {flipping && <i key={`reveal-${state.flips}`} className="flip-shade flip-shade--reveal" />}
      </div>

      {/* ② 静态下半片：翻页过程中保持旧值 */}
      <div className="flip-half flip-half--bottom">
        <span className="flip-glyph">{flipping ? state.previous : state.current}</span>
        {flipping && <i key={`cover-${state.flips}`} className="flip-shade flip-shade--cover" />}
      </div>

      {flipping && (
        <>
          {/* ③ 翻转上片：旧值，向前倒下 */}
          <div key={`top-${state.flips}`} className="flip-half flip-half--top flip-flap flip-flap--top">
            <span className="flip-glyph">{state.previous}</span>
            <i className="flip-shade flip-shade--flap-top" />
          </div>
          {/* ④ 翻转下片：新值，落下后回弹 */}
          <div
            key={`bottom-${state.flips}`}
            className="flip-half flip-half--bottom flip-flap flip-flap--bottom"
            onAnimationEnd={handleFlipEnd}
          >
            <span className="flip-glyph">{state.current}</span>
            <i className="flip-shade flip-shade--flap-bottom" />
          </div>
        </>
      )}

      {/* 中缝铰链 + 两侧转轴 */}
      <div className="flip-hinge" />
    </div>
  )
})
