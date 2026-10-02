/**
 * Electron 主进程
 * 负责：无边框透明窗口、置顶、窗口位置/尺寸记忆、右键菜单、开机自启、IPC 通信
 */
const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const isDev = Boolean(DEV_SERVER_URL)

// 开发模式使用独立的用户数据目录：不与已安装版本共享设置，也不会被单实例锁拦截
if (isDev) app.setPath('userData', path.join(app.getPath('appData'), 'FlipClock-dev'))

// 默认窗口尺寸（与渲染进程 src/lib/layout.ts 中的基准保持一致：37rem x 15.625rem @16px）
const DEFAULT_SIZE = { width: 592, height: 250 }
const STATE_FILE = path.join(app.getPath('userData'), 'window-state.json')
// 开机自启仅 Windows / macOS 支持，且只在打包后的应用中启用，避免把 electron.exe 注册进启动项
const loginItemSupported = app.isPackaged && ['win32', 'darwin'].includes(process.platform)

/** @type {BrowserWindow | null} */
let win = null

/* ------------------------------------------------------------------ */
/* 窗口状态持久化                                                       */
/* ------------------------------------------------------------------ */

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

let saveTimer = null
let state = loadState()

/** 合并并延迟写入窗口状态，避免拖拽时频繁写盘 */
function saveState(patch) {
  state = { ...state, ...patch }
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true })
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
    } catch (err) {
      console.error('[FlipClock] 保存窗口状态失败：', err)
    }
  }, 400)
}

/** 校验保存的坐标是否仍落在某个显示器内（防止拔掉副屏后窗口跑到屏幕外） */
function isVisibleOnSomeDisplay(x, y, width, height) {
  return screen.getAllDisplays().some(({ workArea: a }) => {
    return x + width > a.x + 40 && x < a.x + a.width - 40 && y >= a.y - 10 && y < a.y + a.height - 40
  })
}

/** 默认位置：主屏工作区右上角 */
function defaultPosition(width) {
  const { workArea } = screen.getPrimaryDisplay()
  return { x: workArea.x + workArea.width - width - 32, y: workArea.y + 32 }
}

/* ------------------------------------------------------------------ */
/* 窗口创建                                                             */
/* ------------------------------------------------------------------ */

function getPublicState() {
  return {
    alwaysOnTop: win ? win.isAlwaysOnTop() : Boolean(state.alwaysOnTop ?? true),
    openAtLogin: loginItemSupported ? app.getLoginItemSettings().openAtLogin : false,
    loginItemSupported,
    platform: process.platform,
  }
}

/** 主进程侧状态变化（例如在右键菜单里切换置顶）时通知渲染进程 */
function broadcastState() {
  if (win && !win.isDestroyed()) win.webContents.send('win:state', getPublicState())
}

function setAlwaysOnTop(flag) {
  if (!win) return
  // 'floating' 级别足以浮于普通窗口之上；macOS 下 'screen-saver' 会盖住全屏应用，过于激进
  win.setAlwaysOnTop(Boolean(flag), 'floating')
  saveState({ alwaysOnTop: Boolean(flag) })
  broadcastState()
}

function resetPosition() {
  if (!win) return
  const [width] = win.getSize()
  const { x, y } = defaultPosition(width)
  win.setPosition(x, y)
}

function buildContextMenu() {
  const template = [
    {
      label: '窗口置顶',
      type: 'checkbox',
      checked: win?.isAlwaysOnTop() ?? false,
      click: (item) => setAlwaysOnTop(item.checked),
    },
    {
      label: '开机自启',
      type: 'checkbox',
      enabled: loginItemSupported,
      checked: loginItemSupported && app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked })
        broadcastState()
      },
    },
    { type: 'separator' },
    { label: '重置位置', click: resetPosition },
    { label: '最小化', click: () => win?.minimize() },
  ]
  if (isDev) {
    template.push({ label: '开发者工具', click: () => win?.webContents.toggleDevTools() })
  }
  template.push({ type: 'separator' }, { label: '退出 FlipClock', click: () => app.quit() })
  return Menu.buildFromTemplate(template)
}

function createWindow() {
  const width = Number(state.width) || DEFAULT_SIZE.width
  const height = Number(state.height) || DEFAULT_SIZE.height
  let { x, y } = state
  if (typeof x !== 'number' || typeof y !== 'number' || !isVisibleOnSomeDisplay(x, y, width, height)) {
    ;({ x, y } = defaultPosition(width))
  }

  const iconPath = path.join(__dirname, '..', 'build', 'icon.png')

  win = new BrowserWindow({
    x,
    y,
    width,
    height,
    show: false,
    title: 'FlipClock',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    // —— 桌面摆件的核心窗口特性 ——
    frame: false, // 无边框
    transparent: true, // 透明背景，配合 CSS 实现圆角玻璃面板
    backgroundColor: '#00000000',
    hasShadow: false, // 阴影由 CSS 绘制，避免透明窗口出现系统矩形阴影
    resizable: false, // Windows 上透明窗口不支持边缘拖拽缩放，改用设置面板中的“尺寸”滑块
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: state.alwaysOnTop ?? true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // 关键：窗口被遮挡/失焦时不节流定时器，保证秒级翻页准确
      backgroundThrottling: false,
      spellcheck: false,
    },
  })

  if (state.alwaysOnTop ?? true) win.setAlwaysOnTop(true, 'floating')

  win.once('ready-to-show', () => win?.show())

  // 记录窗口位置与尺寸
  const persistBounds = () => {
    if (!win || win.isMinimized()) return
    const b = win.getBounds()
    saveState({ x: b.x, y: b.y, width: b.width, height: b.height })
  }
  win.on('moved', persistBounds)
  win.on('resized', persistBounds)
  // 兜底：拖拽过程中窗口失焦（如 Alt+Tab）时结束拖拽，避免窗口一直跟随光标
  win.on('blur', stopDrag)

  // 安全加固：禁止打开新窗口与页面跳转
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, url) => {
    if (!isDev || !url.startsWith(DEV_SERVER_URL)) event.preventDefault()
  })

  // 开发模式下 F12 打开调试工具（已移除默认菜单，所以手动绑定）
  if (isDev) {
    win.webContents.on('before-input-event', (_event, input) => {
      if (input.type === 'keyDown' && input.key === 'F12') win?.webContents.toggleDevTools()
    })
  }

  if (isDev) {
    win.loadURL(DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  win.on('closed', () => {
    win = null
  })
}

/* ------------------------------------------------------------------ */
/* IPC                                                                 */
/* ------------------------------------------------------------------ */

ipcMain.handle('win:get-state', () => getPublicState())

ipcMain.handle('win:set-always-on-top', (_e, flag) => {
  setAlwaysOnTop(flag)
  return getPublicState()
})

ipcMain.handle('app:set-open-at-login', (_e, flag) => {
  if (loginItemSupported) app.setLoginItemSettings({ openAtLogin: Boolean(flag) })
  return getPublicState()
})

ipcMain.on('win:set-size', (_e, width, height) => {
  if (!win) return
  const w = Math.round(Math.min(Math.max(Number(width) || DEFAULT_SIZE.width, 200), 2400))
  const h = Math.round(Math.min(Math.max(Number(height) || DEFAULT_SIZE.height, 100), 1200))
  const [cw, ch] = win.getSize()
  if (cw === w && ch === h) return
  // 以右上角为锚点缩放，摆件通常放在屏幕右上角，这样缩放时不会“跑出”屏幕
  const b = win.getBounds()
  win.setBounds({ x: b.x + b.width - w, y: b.y, width: w, height: h })
  saveState({ ...win.getBounds() })
})

/* ---------- 手动拖拽窗口 ----------
 * 不使用 CSS 的 app-region: drag：在 Windows 上拖拽区域会吞掉所有鼠标事件，
 * 导致其内部的按钮无法点击、悬停/滚轮/右键失效。
 * 改为：渲染进程按下鼠标时通知主进程，主进程以 120Hz 轮询光标位置移动窗口，松开时结束。
 */
let drag = null

function stopDrag() {
  if (!drag) return
  clearInterval(drag.timer)
  drag = null
  // 程序化移动不会触发 'moved' 事件，这里手动保存位置
  if (win && !win.isDestroyed()) saveState({ ...win.getBounds() })
}

ipcMain.on('win:drag-start', () => {
  if (!win) return
  stopDrag()
  const startCursor = screen.getCursorScreenPoint()
  const startBounds = win.getBounds()
  const timer = setInterval(() => {
    if (!win || win.isDestroyed()) return stopDrag()
    const cursor = screen.getCursorScreenPoint()
    const x = startBounds.x + cursor.x - startCursor.x
    const y = startBounds.y + cursor.y - startCursor.y
    const b = win.getBounds()
    // 始终带上起始宽高：规避 Windows 非 100% 缩放下 setPosition 导致窗口尺寸逐渐“变大”的问题
    if (b.x !== x || b.y !== y) win.setBounds({ x, y, width: startBounds.width, height: startBounds.height })
  }, 1000 / 120)
  drag = { timer }
})

ipcMain.on('win:drag-end', stopDrag)

ipcMain.on('win:minimize', () => win?.minimize())
ipcMain.on('win:close', () => win?.close())
ipcMain.on('win:context-menu', () => {
  if (win) buildContextMenu().popup({ window: win })
})

/* ------------------------------------------------------------------ */
/* 应用生命周期                                                         */
/* ------------------------------------------------------------------ */

// 单实例：再次启动时聚焦已有窗口
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  })

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null)
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  // 桌面摆件：关闭窗口即退出（包括 macOS）
  app.on('window-all-closed', () => app.quit())
}
