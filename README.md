# FlipClock · 3D 机械翻页桌面时钟

一个精致的桌面时钟小摆件：复古机械翻页（Split-flap）动画 + 暗色玻璃态面板，支持全球多时区切换、窗口置顶、半透明、任意拖拽。

技术栈：**Electron 44 + Vite 8 + React 19 + Tailwind CSS 4 + TypeScript**

## ✨ 功能

| 功能 | 说明 |
| --- | --- |
| 默认北京时间 | 启动即显示 `Asia/Shanghai` 时间，精确到秒，对齐系统时钟整秒刷新 |
| 多时区切换 | 20 个主流城市（纽约 / 洛杉矶 / 伦敦 / 东京 / 巴黎 / 悉尼…），支持搜索、常用胶囊、滚轮 / 方向键快速切换，自动处理夏令时 |
| 3D 翻页动画 | 每秒自动翻页：上片加速倒下 → 下片落下并两次机械回弹，配合动态光影；切换时区时卡片从左到右“多米诺”级联翻转 |
| 视觉风格 | 暗色玻璃态面板、渐变描边高光、噪点质感、卡片堆叠纸边与金属铰链；三套主题：石墨 / 复古 / 霓虹 |
| 窗口特性 | 无边框、透明圆角、整块面板可拖拽、置顶开关、背景透明度调节、尺寸缩放、位置记忆、单实例、开机自启 |
| 细节 | 12/24 小时制、可隐藏秒数（窗口自动收窄）、底栏显示日期 / 星期 / UTC 偏移 / 与北京时差、失焦自动隐藏按钮 |

## 📁 项目结构

```
time_clock/
├── electron/
│   ├── main.cjs              # 主进程：无边框透明窗口、置顶、位置记忆、右键菜单、开机自启、IPC
│   └── preload.cjs           # 预加载：通过 contextBridge 暴露安全的 window.desktop API
├── src/
│   ├── components/
│   │   ├── FlipDigit.tsx     # ★ 单个 3D 翻页卡片（四层半片结构）
│   │   ├── FlipClock.tsx     # 时:分:秒 组合、冒号指示灯、AM/PM、级联翻页
│   │   ├── ZonePicker.tsx    # 时区选择器（搜索 + 常用胶囊 + 实时预览网格）
│   │   └── SettingsPanel.tsx # 设置面板（置顶 / 12h / 秒数 / 透明度 / 尺寸 / 主题 / 自启）
│   ├── hooks/
│   │   ├── useNow.ts         # 整秒对齐的自校准计时器
│   │   ├── useSettings.ts    # 设置持久化（localStorage + 校验）
│   │   └── useDesktop.ts     # 与主进程同步窗口状态、窗口焦点
│   ├── lib/
│   │   ├── time.ts           # ★ 时区转换逻辑（Intl.DateTimeFormat）
│   │   ├── timezones.ts      # 时区 / 城市数据
│   │   └── layout.ts         # 窗口尺寸与等比缩放基准
│   ├── styles/flip.css       # ★ 3D 翻页动画 CSS（关键帧、光影、铰链）
│   ├── types/desktop.d.ts    # window.desktop 类型声明
│   ├── index.css             # Tailwind、主题变量、玻璃面板与控件样式
│   ├── App.tsx               # 布局、快捷键、窗口尺寸联动
│   └── main.tsx              # 入口（本地字体，离线可用）
├── scripts/gen-icon.mjs      # 纯 Node 生成应用图标 build/icon.png
├── build/icon.png            # 应用图标（electron-builder 使用）
├── index.html
├── vite.config.ts
├── tsconfig.json
├── .npmrc                    # Electron / electron-builder 国内镜像
└── package.json              # 脚本与 electron-builder 打包配置
```

## 🚀 运行与打包

需要 **Node.js 20+**（已在 Node 24 / Windows 11 上验证）。

```bash
# 1. 安装依赖（.npmrc 已配置 npmmirror 镜像，国内可直接下载 Electron）
npm install

# 2. 开发模式：同时启动 Vite 与 Electron，支持热更新（F12 打开调试工具）
npm run dev

# 仅在浏览器中预览界面（无窗口特性，便于调样式）
npm run dev:web

# 3. 本地以生产模式运行
npm start

# 4. 打包
npm run dist:win     # Windows：release/ 下生成 NSIS 安装包 + 免安装便携版
npm run dist:mac     # macOS：dmg（需在 macOS 上执行）
npm run dist:linux   # Linux：AppImage
```

> 修改图标：替换 `build/icon.png`（≥ 512×512），或调整 `scripts/gen-icon.mjs` 后执行 `npm run icon` 重新生成。

## 🎮 操作方式

| 操作 | 效果 |
| --- | --- |
| 按住面板任意位置拖动 | 移动窗口（位置自动记忆） |
| 点击左上角城市胶囊 / `Z` | 打开时区选择器（支持搜索，回车选中第一个） |
| 在城市胶囊上滚动滚轮 / `←` `→` | 快速切换上一个 / 下一个城市 |
| `P` | 切换窗口置顶 |
| `H` | 切换 12 / 24 小时制 |
| `S` 或 `,` | 打开设置 |
| `Ctrl` + `+` / `-` / `0` | 放大 / 缩小 / 重置尺寸 |
| `Esc` | 关闭弹层 |
| 右键 | 原生菜单：置顶、开机自启、重置位置、退出 |

窗口失去焦点时，右上角按钮会自动隐藏，只留下干净的时钟；点击窗口或鼠标移到右上角即可浮现。

## 🔧 核心实现说明

### 1. 3D 翻页动画（`FlipDigit.tsx` + `styles/flip.css`）

每张卡片由 **4 个半片**叠成。数字写在一个 200% 高的 `span` 中，半片用 `overflow: hidden` 只露出上半或下半部分：

```
┌──────────────┐  ① 静态上半片：【新】数字上半  —— 被③盖住，③倒下后露出
│  ③ 翻转上片   │  ③ 翻转上片：【旧】数字上半，绕底边 rotateX(0 → -90°) 向前倒下
├──── 铰链 ─────┤
│  ④ 翻转下片   │  ④ 翻转下片：【新】数字下半，绕顶边 rotateX(90° → 0) 落下 + 回弹
└──────────────┘  ② 静态下半片：【旧】数字下半  —— 直到④落下将其覆盖
```

- **时序**：③ 用 `ease-in` 加速倒下（250ms，模拟重力）；④ 在 ③ 结束后开始（`animation-delay`），关键帧中在 16°、4° 处两次回弹，模拟机械撞击。整个翻页约 675ms，小于 1 秒。
- **光影**：每个半片内有一层 `.flip-shade` 渐变遮罩，与翻转同步改变透明度：倒下的上片逐渐背光变暗、新露出的上半部阴影散去、即将被覆盖的旧下半部逐渐变暗、落下的下片由暗转亮。
- **立体感**：卡片容器设置 `perspective`（卡片高度的 3 倍），翻转层 `backface-visibility: hidden`；底部两层 `box-shadow` 模拟卡片堆叠的纸边，中缝铰链两侧画了金属转轴。
- **React 状态**：使用“渲染期间派生状态”模式——值变化的同一次渲染中记录 `previous / current` 并递增 `flips`；`flips` 作为翻转层的 `key`，保证每次都会重新挂载并重启 CSS 动画；下片的 `animationend` 触发后移除翻转层。
- **级联过渡**：`FlipClock` 检测到时区变化时，为每张卡片分配 `index × 50ms` 的延迟，形成从左到右的“多米诺”翻页。

### 2. 时区转换（`lib/time.ts`）

完全基于浏览器内置的 `Intl.DateTimeFormat`（ICU 时区库），**自动处理夏令时**，无需第三方库：

```ts
new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  weekday: 'short',
  timeZoneName: 'longOffset', // → "GMT-04:00"，用于计算 UTC 偏移与“较北京时差”
}).formatToParts(new Date())
```

- 每个时区的 formatter 实例会被缓存（每秒都要调用）。
- 所有时区共享同一个 `Date` 时间点，切换时区只是换一种“墙上时间”的读法，因此切换瞬间无缝、无误差。

### 3. 精准秒级计时（`hooks/useNow.ts`）

不使用会累积漂移的 `setInterval(1000)`，而是每次按 `1000 - Date.now() % 1000` 计算到下一个整秒的剩余时间，用 `setTimeout` 自我校准；窗口从休眠 / 隐藏恢复时立刻重新同步。主进程中设置了 `backgroundThrottling: false`，窗口被遮挡时计时器也不会被节流。

### 4. 窗口特性（`electron/main.cjs`）

- `frame: false` + `transparent: true` + `hasShadow: false`：无边框透明窗口，圆角、阴影、描边全部由 CSS 绘制。
- 拖拽：**不使用** `-webkit-app-region: drag`（Windows 上系统拖拽区域会吞掉鼠标事件，导致其中的按钮无法点击、悬停 / 滚轮 / 右键失效）。改为 JS 实现：在面板空白处按下鼠标时通知主进程，主进程以 120Hz 轮询光标位置并 `setBounds` 移动窗口（固定宽高，规避高 DPI 下窗口逐渐变大的问题），松开时结束并保存位置。
- 置顶：`win.setAlwaysOnTop(flag, 'floating')`，状态持久化并通过 IPC 同步到界面与右键菜单。
- 等比缩放：根字号 = `min(100vh / 15.625, 100vw / 宽度rem)`，界面全部使用 rem，窗口尺寸变化时整体等比缩放。
- 尺寸滑块在**松开鼠标时**才应用：缩放会改变窗口大小、滑块随之移位，若拖动中实时缩放会形成反馈循环。
- 窗口位置 / 尺寸保存在 `%APPDATA%/FlipClock/window-state.json`（开发模式使用独立的 `FlipClock-dev` 目录，不影响已安装版本），启动时校验坐标仍在某块显示器内（拔掉副屏也不会“丢失”窗口）。
- 安全：`contextIsolation` + `sandbox`，禁用 Node 集成；生产构建注入严格 CSP；禁止新窗口与页面跳转。

## ❓ 常见问题

**Q：为什么不能拖拽窗口边缘缩放？**
Windows 上透明窗口不支持系统级边缘缩放，请使用设置中的“尺寸”滑块或 `Ctrl` + `+` / `-`。

**Q：桌面背景为什么没有毛玻璃模糊？**
CSS 的 `backdrop-filter` 只能模糊页面内的内容，无法模糊桌面。可在设置中调节“背景透明度”获得理想的通透感。

**Q：打包时报 `EPERM: operation not permitted, rename ... win-unpacked.tmp`？**
通常是有程序占用了项目目录（例如正在运行的 `npm run dev`、资源管理器预览、杀毒软件扫描）。先关闭开发服务器，删除 `release` 目录后重新打包即可。本项目已在 `vite.config.ts` 中忽略监听 `release/` 目录。

**Q：安装依赖时 Electron 下载很慢？**
`.npmrc` 已配置 npmmirror 镜像。npm 11 会提示 `Unknown project config "electron_mirror"`，这是无害的警告；如需消除，可删除 `.npmrc`，改为设置环境变量 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`。

**Q：开机自启在开发模式下不可用？**
是的，为避免把 `electron.exe` 注册到启动项，该功能只在打包后的应用中启用（Windows / macOS）。

**Q：如何添加更多城市？**
在 `src/lib/timezones.ts` 的 `ZONES` 中添加一项即可（`id` 使用 IANA 时区名，例如 `Europe/Rome`）。
