/**
 * 窗口布局基准
 * 根字号 = min(100vh / BASE_HEIGHT_REM, 100vw / 宽度rem)，
 * 所有尺寸都以 rem 表达，因此窗口缩放时整个摆件等比例缩放。
 */
export const BASE_FONT_PX = 16
export const BASE_HEIGHT_REM = 15.625 // 250px @16px
export const WIDTH_REM_WITH_SECONDS = 37
export const WIDTH_REM_WITHOUT_SECONDS = 25.5

export const SCALE_MIN = 0.6
export const SCALE_MAX = 1.8

export function getWidthRem(showSeconds: boolean): number {
  return showSeconds ? WIDTH_REM_WITH_SECONDS : WIDTH_REM_WITHOUT_SECONDS
}

/** 根据缩放比例与是否显示秒数，计算窗口像素尺寸 */
export function getWindowSize(scale: number, showSeconds: boolean) {
  return {
    width: Math.round(getWidthRem(showSeconds) * BASE_FONT_PX * scale),
    height: Math.round(BASE_HEIGHT_REM * BASE_FONT_PX * scale),
  }
}

export function clampScale(scale: number): number {
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round(scale * 100) / 100))
}
