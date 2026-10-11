/**
 * 系統字型安裝：Abenda。
 *
 * 應用程式使用的字型檔隨 App 一起打包（打包後位於 Resources/fonts，開發時位於
 * src/renderer/styles/fonts），啟動時複製到使用者的字型資料夾，讓 Abenda 在
 * 使用者電腦上呈「已安裝」狀態——App 視窗、PDF 匯出與其他軟體都能直接使用。
 *
 * 各平台的使用者字型資料夾（不需管理者權限）：
 *   - macOS  ：~/Library/Fonts
 *   - Linux  ：~/.local/share/fonts（複製後執行 fc-cache）
 *   - Windows：%LOCALAPPDATA%\Microsoft\Windows\Fonts（另需寫入登錄檔）
 *
 * 註：Abenda 為拉丁字型（僅涵蓋 ASCII 與拉丁補充字元），中文字由渲染端的後備字型
 * （PingFang TC 等）呈現，與本模組無關。
 */

import { app } from 'electron'
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const FONT_FILE = 'Abenda.ttf'

/** 隨 App 打包的來源字型檔路徑。 */
function bundledFontPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'fonts', FONT_FILE)
    : path.join(app.getAppPath(), 'src/renderer/styles/fonts', FONT_FILE)
}

/** 各平台「使用者字型資料夾」中的安裝目標路徑；不支援的平台回傳 null。 */
function installTargetPath(): string | null {
  const home = app.getPath('home')
  if (process.platform === 'darwin') return path.join(home, 'Library', 'Fonts', FONT_FILE)
  if (process.platform === 'linux') return path.join(home, '.local', 'share', 'fonts', FONT_FILE)
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA ?? path.join(home, 'AppData', 'Local')
    return path.join(local, 'Microsoft', 'Windows', 'Fonts', FONT_FILE)
  }
  return null
}

/** 兩檔案內容是否一致，避免每次啟動都重寫字型檔。 */
function isUpToDate(src: string, dest: string): boolean {
  try {
    if (fs.statSync(src).size !== fs.statSync(dest).size) return false
    return fs.readFileSync(src).equals(fs.readFileSync(dest))
  } catch {
    return false
  }
}

/** Linux：通知 fontconfig 重建字型快取，系統才會立即認得新字型。 */
function refreshFontCache(): void {
  execFile('fc-cache', ['-f'], (err) => {
    if (err) console.warn('[fonts] fc-cache 執行失敗：', err.message)
  })
}

/** Windows：寫入登錄檔才會被系統辨識為已安裝字型。 */
function registerWindowsFont(): void {
  const key = 'HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Fonts'
  execFile('reg', ['add', key, '/v', 'Abenda (TrueType)', '/t', 'REG_SZ', '/d', FONT_FILE, '/f'], (err) => {
    if (err) console.warn('[fonts] 寫入字型登錄檔失敗：', err.message)
  })
}

/**
 * 將內建字型安裝到使用者系統。已存在且內容相同時不重複寫入；
 * 任何失敗都不影響 App 啟動（渲染端另有內嵌 @font-face 可獨立運作）。
 */
export function installBundledFonts(): void {
  try {
    const dest = installTargetPath()
    if (!dest) return
    const src = bundledFontPath()
    if (!fs.existsSync(src)) {
      console.warn('[fonts] 找不到內建字型檔：', src)
      return
    }
    if (isUpToDate(src, dest)) return
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
    console.log('[fonts] 已安裝字型：', dest)
    if (process.platform === 'linux') refreshFontCache()
    if (process.platform === 'win32') registerWindowsFont()
  } catch (err) {
    console.warn('[fonts] 安裝字型失敗：', err instanceof Error ? err.message : err)
  }
}
