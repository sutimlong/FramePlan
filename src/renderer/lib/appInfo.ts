/** 應用程式名稱的後備值：僅在非 Electron 環境（例如純瀏覽器開啟）時使用 */
const FALLBACK_APP_NAME = '通告表製作工具'

let appName = FALLBACK_APP_NAME

/** 取得應用程式名稱（來源為主程序 package.json 的 productName，修改一處即可全站同步） */
export function getAppName(): string {
  return appName
}

/**
 * 從主程序讀取應用程式名稱並快取；請在 React 首次渲染前呼叫，
 * 讓側邊欄等處可以直接同步取得名稱、避免畫面閃爍。
 */
export async function initAppInfo(): Promise<void> {
  try {
    const name = await window.electronAPI?.getAppName()
    if (typeof name === 'string' && name.trim()) appName = name.trim()
  } catch {
    // 讀取失敗時沿用後備名稱，不影響應用程式啟動
  }
}
