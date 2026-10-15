# FramePlan

**FramePlan** 是一套**本地端**的電影／影視「通告表（Callsheet）」與「拍攝行程表（Rundown）」製作工具。它把所有繁雜的拍攝前製資料——劇組、演員、工作人員、場次、車輛與天氣——整理在同一個地方，一鍵匯出成專業、可直接發給劇組的 A4 橫式 PDF 通告表。

> 資料完全留在你電腦裡、不需要登入任何雲端帳號；只有查詢天氣預報與匯出 PDF 的 QR 分享連結會連網。

---

## 目錄

- [功能特色](#功能特色)
- [下載與安裝](#下載與安裝)
- [快速上手](#快速上手)
- [程式技術概念](#程式技術概念)
- [專案結構](#專案結構)
- [開發指南](#開發指南)

---

## 功能特色

### 🗂 一檔多天的專案管理

- 單一 `.sched` 檔案可容納**多個拍攝日**，專案資訊（片名、公司、版本、主要聯絡人）全案共用。
- 支援「複製前一天」，快速延續連續拍攝的場次與車表安排。
- 側邊欄顯示目前版本號與檔名；視窗標題即時反映「未命名 / 檔名 + 已編輯」狀態。

### 🎬 拍攝行程表（Rundown）

- 以「場次（Scene）」與「換景／休息（Break）」交錯編排整日行程。
- 每場可記錄：時間、場號／鏡號、攝影機運動（Camera Movement）、內外景（INT/EXT）、日夜（Day/Night）、場景、地點、描述與臨演備註。
- 支援**拖放排序**（滑鼠與鍵盤皆可），隨時調整場次順序。
- 每場可附**分鏡圖片**（JPG／PNG／WebP），自動壓縮後內嵌進檔案。

### 👥 演員管理（Cast）

- 記錄角色名、演員名、編號、電話、Email 與**大頭照**（內建裁切工具，自動轉正）。
- 每位演員可針對「某一天」獨立設定通告狀態：開工／工作／收工／當天進出／待命／排練。
- 詳細記錄通告時間、梳化（MU/Ward）、上工時間與備註。

### 🧑‍🔧 工作人員管理（Crew）

- 以「部門」（導演組、製片組、攝影組…可自訂顏色）分組管理。
- 每位人員可記錄職位、聯絡方式、照片與備註。
- 每日出勤時間可個別覆寫，未指定者自動沿用全組總通告時間。

### 🚗 交通與車輛管理（Transport）

- 預設多種車型（保母車、燈光／攝影車、美術車、接駁車…）並可自訂。
- 每台車記錄司機、車牌、座位數；逐日設定是否出車、出發／到達／返程時間、目的與行程。
- 智慧檢查：**超載提醒、乘客當天不出勤、同一人同時被排進兩台車、缺司機／缺時間**。
- 集合地點、目的地、乘客上下車地點皆可自由填寫，原樣列印到通告表。

### 🌤 天氣自動填入

- 依拍攝地的經緯度自動抓取**天氣預報**，填入最高／最低溫、天氣狀況與中文摘要。
- 拍攝日超過預報範圍時，自動改查**歷史氣候資料**與日出日落時間，並清楚標示「預估」。
- 整合臺灣各縣市地標，輸入「台北」或「陽明山」即可定位。

### 🖨 專業 PDF 匯出

- 每日輸出為**兩頁 A4 橫式**版面（通告資訊 + 工作人員通告／車表）。
- 可選擇匯出「目前這天」或「全部天數」，每頁自動加上「第 X 頁，共 Y 頁」頁碼。
- 尾頁附上**分享用 QR code**：匯出時把 PDF 匿名上傳到 Catbox 取得公開網址並印成 QR code，收到紙本的人掃描即可取得線上通告表；上傳失敗時仍會正常輸出不含 QR 的 PDF。
- 內嵌字型與分鏡圖片，輸出結果在不同電腦上保持一致。

### 🔒 本地優先、重視安全

- 所有資料以 `.sched`（JSON）檔案形式存在本機，**不需登入任何雲端帳號**。
- 唯一的檔案上傳行為是匯出 PDF 時取得 QR code 分享連結（匿名上傳到 Catbox，網址為公開連結）；除此之外不會把資料傳到任何伺服器。
- 採用嚴格的 Content-Security-Policy、`contextIsolation` 與 `sandbox`。
- 關閉視窗前會主動提醒儲存未存檔的變更，避免資料遺失。

---

## 下載與安裝

FramePlan 目前提供 **macOS（Apple Silicon / arm64）** 版本。請到 GitHub 的 Release 頁面下載最新版：

👉 **[前往 Release 下載](https://github.com/sutimlong/FramePlan/releases)**

在最新的 Release（目前為 `v1.2.0`）頁面中，你可以看到兩種安裝檔：

| 檔案 | 說明 |
| --- | --- |
| `FramePlan-1.2.0-arm64.dmg` | **建議使用**。掛載後把 FramePlan 拖進「應用程式」資料夾即可。 |
| `FramePlan-1.2.0-arm64.app.zip` | 免安裝壓縮檔，解壓後直接執行 `.app`。 |

### 安裝步驟（DMG）

1. 下載 `FramePlan-1.2.0-arm64.dmg`。
2. 雙擊開啟 DMG 映像檔。
3. 將 `FramePlan` 圖示拖曳到「應用程式（Applications）」資料夾。
4. 首次開啟時，若系統提示「無法驗證開發者」，請到「系統設定 → 隱私權與安全性」點選「**仍要打開**」。

> 💡 由於應用程式尚未進行 Apple 開發者簽名公證（Notarization），macOS 預設會攔截，這是正常的系統安全機制，不是錯誤。

### 系統需求

- macOS 12+（Apple Silicon，M 系列晶片）
- 約 300 MB 可用磁碟空間

> 需要 Intel 或 Windows 版本嗎？歡迎在 [Issues](https://github.com/sutimlong/FramePlan/issues) 提出需求。

---

## 快速上手

1. 開啟 FramePlan 後，預設會建立一份空白通告表。
2. 在左側 **「專案」** 分頁填入片名、公司與主要聯絡人。
3. 在 **「演員」／「工作人員」** 分頁建立劇組名單。
4. 在 **「行程」** 分頁編排當日場次；需要多天時用頂部的日列（Day Bar）新增拍攝日。
5. 在 **「交通」** 分頁安排車輛與乘客。
6. 切到 **「預覽」** 分頁確認版面，最後用 **「檔案 → 匯出 PDF」**（或 `⌘P`）輸出通告表。

存檔格式為 `.sched`，可隨時「另存新檔」或開啟既有檔案繼續編輯。


---

## 程式技術概念

### 架構總覽：Electron 三層結構

FramePlan 採用 Electron 的經典三層架構，將「系統能力」與「介面」明確分離：

```
┌─────────────────────────────────────────────────┐
│  主程序 (Main Process)  src/main/                 │
│  - 視窗管理、原生選單、檔案讀寫、PDF 輸出、字型安裝  │
│  - 透過 ipcMain 提供系統能力                        │
└───────────────────┬─────────────────────────────┘
                    │  IPC（contextBridge 暴露白名單 API）
┌───────────────────▼─────────────────────────────┐
│  預載 (Preload)  src/preload/preload.cjs          │
│  - contextBridge 將安全、限定的 window.electronAPI │
│    暴露給渲染端，避免直接接觸 Node 能力             │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│  渲染程序 (Renderer)  src/renderer/               │
│  - React 19 介面、狀態管理、所有編輯邏輯            │
│  - 透過 window.electronAPI 呼叫系統功能            │
└─────────────────────────────────────────────────┘
```

關鍵安全設定：`contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`、`webSecurity: true`，並對所有外連（天氣、地理編碼 API）套用白名單式的 Content-Security-Policy。

### 技術棧（Tech Stack）

| 層級 | 技術 | 用途 |
| --- | --- | --- |
| 桌面框架 | Electron 44 | 跨平台桌面應用 |
| UI | React 19 + TypeScript | 介面與型別安全 |
| 建置 | Vite 8 + `vite-plugin-electron` | 開發伺服器與打包 |
| 狀態管理 | Zustand 5 | 全站狀態（文件、髒狀態、視圖） |
| 富文字編輯 | Slate + slate-react + slate-history | 場次描述、備註等富文字 |
| 拖放排序 | @dnd-kit | Rundown 場次排序 |
| 動畫 | framer-motion | 視圖切換與提示動畫 |
| 圖示 | lucide-react | 介面圖示 |
| 圖片裁切 | react-easy-crop | 演員大頭照裁切 |
| 資料驗證 | Zod 4 | `.sched` 檔案的 schema 驗證與遷移 |
| 測試 | Vitest 5 | 單元測試 |
| 打包 | electron-builder | 產出 DMG / zip |

### 資料模型與版本化

- 檔案格式為單一 JSON 檔，副檔名 `.sched`。
- 文件結構定義在 `src/shared/schema.ts`，主程序與渲染端共用同一份型別（透過 `@shared` 別名）。
- `formatVersion` 記錄檔案版本；讀檔時以 **Zod** 驗證，並支援 **v1 → v2 的自動遷移**（從「一檔一天」升級為「一檔多天」）。
- 舊版的「地點代碼」（如 `pickup`、`basecamp`）會自動轉成自由文字，維持向下相容。

### 狀態管理（Zustand）

- 單一 `useProjectStore` 儲存整份 `SchedDocument`。
- 所有修改都走 **immutable update**（`patch` / `patchDay`），並同步更新 `meta.updatedAt` 與 `dirty` 旗標。
- `dirty` 狀態回報給主程序，用於視窗標題與「關閉前存檔提醒」。
- 切換天數或載入新檔時，以 `loadCount` 作為 key 強制重新掛載 Slate 編輯器，確保內容正確載入。

### 檔案讀寫的可靠性

- 採用**「先寫暫存檔、再更名」**的原子化寫入策略，避免寫到一半中斷而損毀原檔。
- 檔案大小上限 200 MB，副檔名嚴格限制為 `.sched`。
- 讀檔時先驗證 `formatVersion` 與 schema，失敗時**還原原本的檔案路徑**，避免使用者誤存錯檔。


### PDF 匯出

- 透過 Electron 的 `webContents.printToPDF()` 輸出，使用 `print` 媒體樣式（見 `print.css`）。
- 匯出前會**等待字型與分鏡圖片全部載入、排版與繪製完成**，避免產出空白或半成品 PDF。
- 頁碼由 Chromium 於列印時代入（`第 X 頁，共 Y 頁`），頁首模板清空以隱藏預設網址標題。

### 外部資料整合（天氣）

- **Open-Meteo**：天氣預報與歷史氣候資料。
- **Sunrise-Sunset**：精確日出日落時間。
- **Nominatim（OpenStreetMap）**：地點文字 → 經緯度地理編碼。
- 依拍攝日距離自動切換策略：近期 → 即時預報；超過預報範圍 → 歷史氣候 + 天文日出日落，並標示「預估」。
- 所有外連網域都寫進 CSP 白名單，其餘一律封鎖。

### 字型處理

- 隨 App 打包拉丁字型 **Abenda**，啟動時自動安裝到使用者字型資料夾（macOS／Windows／Linux 各平台路徑不同），使視窗、PDF 與其他軟體都能使用。
- 中文字交由系統後備字型（PingFang TC 等）呈現；渲染端另有 `@font-face` 內嵌，字型安裝失敗不影響 App 啟動。

---

## 專案結構

```
FramePlan/
├── src/
│   ├── main/                  # Electron 主程序
│   │   ├── index.ts           # 視窗建立、CSP、啟動流程
│   │   ├── menu.ts            # 原生選單
│   │   ├── state.ts           # 主程序狀態與視窗標題
│   │   ├── fonts.ts           # 內建字型安裝
│   │   └── ipc/               # IPC 處理（app / file / pdf）
│   ├── preload/
│   │   └── preload.cjs        # contextBridge 白名單 API
│   ├── shared/                # 主程序與渲染端共用的型別與頻道定義
│   │   ├── schema.ts          # 資料模型
│   │   └── ipc-channels.ts    # IPC 頻道與參數型別
│   └── renderer/              # React 前端
│       ├── components/        # 各功能分頁（cast / crew / rundown / transport / print…）
│       ├── store/             # Zustand 狀態與 actions
│       ├── lib/               # 業務邏輯（驗證、天氣、交通、檔案動作）
│       ├── styles/            # CSS 與字型
│       └── types/             # 全域型別宣告
├── build/                     # 打包資源（App 圖示）
├── release/                   # electron-builder 產出（DMG / zip）
├── electron-builder.yml       # 打包設定
└── vite.config.ts             # 建置設定
```

---

## 開發指南

### 環境需求

- Node.js 20+
- npm

### 安裝與執行

```bash
# 安裝依賴
npm install

# 啟動開發模式（Vite + Electron HMR）
npm run dev

# 型別檢查
npm run typecheck

# 執行單元測試
npm test

# 建置正式版
npm run build

# 打包 macOS 安裝檔（DMG + zip，輸出到 release/）
npm run dist
```

### 測試

使用 **Vitest** 撰寫單元測試，涵蓋：

- `.sched` schema 驗證（`schedSchema.test.ts`）
- 版本遷移與讀檔（`validateSched.test.ts`）
- 交通超載／衝突檢查（`transport.test.ts`）
- 天氣資料轉換（`weatherService.test.ts`）
- Rundown 排序與工具函式（`rundownRow.test.ts`、`utils.test.ts`）

```bash
npm test              # 執行全部測試一次
npm run test:watch    # 監看模式
```

---

## 授權

此專案目前未指定授權條款。如需使用或再散布，請先聯絡作者。

