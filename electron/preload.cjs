/**
 * 预加载脚本：通过 contextBridge 向渲染进程暴露最小化的、安全的桌面 API
 * 渲染进程中以 window.desktop 访问（类型声明见 src/types/desktop.d.ts）
 */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  /** 读取窗口状态：置顶、开机自启等 */
  getState: () => ipcRenderer.invoke('win:get-state'),
  /** 设置窗口置顶 */
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('win:set-always-on-top', Boolean(flag)),
  /** 设置开机自启 */
  setOpenAtLogin: (flag) => ipcRenderer.invoke('app:set-open-at-login', Boolean(flag)),
  /** 调整窗口尺寸（用于缩放 / 隐藏秒数时自适应宽度） */
  setSize: (width, height) => ipcRenderer.send('win:set-size', width, height),
  /** 开始 / 结束拖拽窗口（主进程跟随光标移动窗口） */
  dragStart: () => ipcRenderer.send('win:drag-start'),
  dragEnd: () => ipcRenderer.send('win:drag-end'),
  /** 隐藏到系统托盘（窗口不占任务栏，无法最小化到任务栏） */
  minimize: () => ipcRenderer.send('win:minimize'),
  close: () => ipcRenderer.send('win:close'),
  /** 弹出原生右键菜单 */
  showContextMenu: () => ipcRenderer.send('win:context-menu'),
  /** 订阅主进程推送的状态变化，返回取消订阅函数 */
  onStateChange: (callback) => {
    const listener = (_event, nextState) => callback(nextState)
    ipcRenderer.on('win:state', listener)
    return () => ipcRenderer.removeListener('win:state', listener)
  },
})
