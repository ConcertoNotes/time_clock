import { useEffect, useState } from 'react'

/**
 * 返回当前时间，并在每个“整秒边界”精准刷新。
 *
 * 不使用 setInterval(1000)：它会累积漂移，导致翻页与系统时钟不同步，
 * 甚至偶尔跳过一秒。这里每次都根据 Date.now() 计算到下一整秒的剩余毫秒数，
 * 用 setTimeout 自我校准。
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timer = 0

    const schedule = () => {
      // +4ms 余量：确保回调触发时已经越过整秒边界
      const delay = 1000 - (Date.now() % 1000) + 4
      timer = window.setTimeout(() => {
        setNow(new Date())
        schedule()
      }, delay)
    }

    // 窗口从隐藏/休眠恢复时立刻同步一次
    const resync = () => {
      if (document.hidden) return
      window.clearTimeout(timer)
      setNow(new Date())
      schedule()
    }

    schedule()
    document.addEventListener('visibilitychange', resync)
    window.addEventListener('focus', resync)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', resync)
      window.removeEventListener('focus', resync)
    }
  }, [])

  return now
}
